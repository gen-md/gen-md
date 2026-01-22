import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const GITGEN_PATH = resolve(import.meta.dirname, "../../gitgen.ts");
const TIMEOUT = 120000; // 2 minutes for LLM calls

// Check if we have an API key available
const hasApiKey = !!(
  process.env.OPENROUTER_API_KEY ||
  process.env.ANTHROPIC_API_KEY ||
  process.env.AWS_ACCESS_KEY_ID
);

function runGitgen(args: string, cwd: string): string {
  return execSync(`npx tsx ${GITGEN_PATH} ${args}`, {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      // Ensure API key is passed through
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    },
    timeout: TIMEOUT,
  });
}

describe("git gen CLI", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "gitgen-test-"));
    // Initialize git repo
    execSync("git init", { cwd: testDir });
    execSync('git config user.email "test@test.com"', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
    // Create initial file and commit
    writeFileSync(join(testDir, "README.md"), "# Test Project\n");
    execSync("git add . && git commit -m 'Initial commit'", { cwd: testDir });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("--help", () => {
    it("shows usage information", () => {
      const output = runGitgen("--help", testDir);
      expect(output).toContain("git gen");
      expect(output).toContain("Usage:");
      expect(output).toContain("learn");
      expect(output).toContain("merge");
    });
  });

  describe("spec generation", () => {
    it("generates from a simple spec file", async () => {
      // Skip if no API key
      if (!hasApiKey) {
        console.log("Skipping: No API key available");
        return;
      }

      // Create a simple spec
      const specContent = `---
output: hello.txt
---
Generate a file that contains exactly: Hello, World!`;
      writeFileSync(join(testDir, "hello.gitgen.md"), specContent);

      const output = runGitgen("hello.gitgen.md", testDir);
      expect(output).toContain("Generating");
      expect(existsSync(join(testDir, "hello.txt"))).toBe(true);

      const content = readFileSync(join(testDir, "hello.txt"), "utf-8");
      expect(content.toLowerCase()).toContain("hello");
    }, TIMEOUT);
  });

  describe("diff command", () => {
    it("shows diff without writing file", async () => {
      if (!hasApiKey) {
        console.log("Skipping: No API key available");
        return;
      }

      const specContent = `---
output: test.txt
---
Generate a file that says "Test Output"`;
      writeFileSync(join(testDir, "test.gitgen.md"), specContent);

      const output = runGitgen("diff test.gitgen.md", testDir);
      expect(output).toContain("Generating");
      // File should NOT be created
      expect(existsSync(join(testDir, "test.txt"))).toBe(false);
    }, TIMEOUT);
  });

  describe("learn command", () => {
    it.skipIf(!hasApiKey)("creates .gitgen.md spec", async () => {
      // Add some files to analyze
      writeFileSync(join(testDir, "package.json"), JSON.stringify({
        name: "test-project",
        version: "1.0.0",
        scripts: { test: "echo test" }
      }, null, 2));
      execSync("git add . && git commit -m 'Add package.json'", { cwd: testDir });

      const output = runGitgen("learn", testDir);
      expect(output).toContain("Analyzing");
      expect(output).toContain("Created .gitgen.md");
      expect(existsSync(join(testDir, ".gitgen.md"))).toBe(true);

      // Verify the spec has valid YAML frontmatter
      const spec = readFileSync(join(testDir, ".gitgen.md"), "utf-8");
      expect(spec).toMatch(/^---\n/);
      // The spec should have output field in frontmatter
      expect(spec).toContain("output:");
    }, TIMEOUT);
  });

  describe("init command", () => {
    it.skipIf(!hasApiKey)("creates spec from existing file", async () => {
      // Create a source file
      const sourceContent = `export function add(a: number, b: number): number {
  return a + b;
}`;
      writeFileSync(join(testDir, "math.ts"), sourceContent);
      execSync("git add . && git commit -m 'Add math.ts'", { cwd: testDir });

      const output = runGitgen("init math.ts", testDir);
      expect(output).toContain("Analyzing");
      expect(existsSync(join(testDir, "math.gitgen.md"))).toBe(true);

      const spec = readFileSync(join(testDir, "math.gitgen.md"), "utf-8");
      expect(spec).toMatch(/^---\n/);
      expect(spec).toContain("output:");
    }, TIMEOUT);
  });

  describe("dry-run", () => {
    it.skipIf(!hasApiKey)("shows plan without creating files", async () => {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({
        name: "test-project",
        version: "1.0.0"
      }, null, 2));
      execSync("git add . && git commit -m 'Add package.json'", { cwd: testDir });

      const initialFiles = execSync("ls -la", { cwd: testDir, encoding: "utf-8" });

      const output = runGitgen('--dry-run "add a hello function"', testDir);
      expect(output).toContain("Planning");
      expect(output).toContain("dry run");

      // No new files should be created (compare file listing)
      const afterFiles = execSync("ls -la", { cwd: testDir, encoding: "utf-8" });
      // The file count should be the same
      expect(afterFiles.split("\n").length).toBe(initialFiles.split("\n").length);
    }, TIMEOUT);
  });

  describe("--prompt flag", () => {
    it.skipIf(!hasApiKey)("accepts custom prompt with learn command", async () => {
      writeFileSync(join(testDir, "package.json"), JSON.stringify({
        name: "test-project",
        version: "1.0.0"
      }, null, 2));
      execSync("git add . && git commit -m 'Add package.json'", { cwd: testDir });

      const output = runGitgen('learn --prompt "focus on testing patterns"', testDir);
      expect(output).toContain("Analyzing");
      expect(output).toContain("Created .gitgen.md");
    }, TIMEOUT);
  });
});

describe("git gen CLI - Error Handling", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "gitgen-error-test-"));
    execSync("git init", { cwd: testDir });
    execSync('git config user.email "test@test.com"', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("fails gracefully with invalid spec file", () => {
    // Create a file that looks like a spec but has invalid content
    writeFileSync(join(testDir, "invalid.gitgen.md"), "not valid yaml frontmatter");

    expect(() => {
      runGitgen("invalid.gitgen.md", testDir);
    }).toThrow();
  });

  it("fails gracefully with missing file", () => {
    expect(() => {
      runGitgen("nonexistent.gitgen.md", testDir);
    }).toThrow();
  });

  it("init fails with nonexistent file", () => {
    expect(() => {
      runGitgen("init nonexistent.ts", testDir);
    }).toThrow();
  });
});
