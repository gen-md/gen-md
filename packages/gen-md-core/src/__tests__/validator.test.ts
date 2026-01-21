import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { Validator, formatValidationResults } from "../validator/index.js";

describe("Validator", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gen-md-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("validate", () => {
    it("should pass validation for a valid .gen.md file with output", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");
      const outputPath = path.join(tempDir, "test");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
output: "test"
---
Generate test content.
`
      );
      await fs.writeFile(outputPath, "Generated content");

      const validator = new Validator();
      const result = await validator.validate(genMdPath);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation for missing output file", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
output: "missing-output.md"
---
Generate test content.
`
      );

      const validator = new Validator();
      const result = await validator.validate(genMdPath);

      expect(result.passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("missing_output");
    });

    it("should fail validation for missing context file", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");
      const outputPath = path.join(tempDir, "test");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
output: "test"
context: ["./missing.json"]
---
Generate test content.
`
      );
      await fs.writeFile(outputPath, "Generated content");

      const validator = new Validator();
      const result = await validator.validate(genMdPath);

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.type === "missing_context")).toBe(true);
    });

    it("should fail validation for missing skill file", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");
      const outputPath = path.join(tempDir, "test");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
output: "test"
skills: ["./missing-skill.md"]
---
Generate test content.
`
      );
      await fs.writeFile(outputPath, "Generated content");

      const validator = new Validator();
      const result = await validator.validate(genMdPath);

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.type === "missing_skill")).toBe(true);
    });

    it("should warn for empty body", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");
      const outputPath = path.join(tempDir, "test");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
output: "test"
---
`
      );
      await fs.writeFile(outputPath, "Generated content");

      const validator = new Validator();
      const result = await validator.validate(genMdPath);

      expect(result.warnings.some((w) => w.type === "empty_body")).toBe(true);
    });

    it("should skip non-path skill names", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");
      const outputPath = path.join(tempDir, "test");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
output: "test"
skills: ["skill-name-only"]
---
Test content.
`
      );
      await fs.writeFile(outputPath, "Generated content");

      const validator = new Validator();
      const result = await validator.validate(genMdPath);

      // Should not error on non-path skill names
      expect(result.errors.filter((e) => e.type === "missing_skill")).toHaveLength(0);
    });
  });

  describe("validateAll", () => {
    it("should validate multiple files", async () => {
      const genMdPath1 = path.join(tempDir, "test1.gen.md");
      const genMdPath2 = path.join(tempDir, "test2.gen.md");
      const outputPath1 = path.join(tempDir, "test1");
      const outputPath2 = path.join(tempDir, "test2");

      await fs.writeFile(genMdPath1, `---\noutput: "test1"\n---\nBody`);
      await fs.writeFile(genMdPath2, `---\noutput: "test2"\n---\nBody`);
      await fs.writeFile(outputPath1, "Content 1");
      await fs.writeFile(outputPath2, "Content 2");

      const validator = new Validator();
      const results = await validator.validateAll([genMdPath1, genMdPath2]);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.passed)).toBe(true);
    });
  });
});

describe("formatValidationResults", () => {
  it("should format passing results", () => {
    const results = [
      {
        genMdPath: "/path/to/test.gen.md",
        outputPath: "/path/to/test",
        passed: true,
        errors: [],
        warnings: [],
      },
    ];

    const output = formatValidationResults(results);

    expect(output).toContain("✓");
    expect(output).toContain("1 passed, 0 failed");
  });

  it("should format failing results with errors", () => {
    const results = [
      {
        genMdPath: "/path/to/test.gen.md",
        outputPath: "/path/to/test",
        passed: false,
        errors: [{ type: "missing_output" as const, message: "Output missing" }],
        warnings: [],
      },
    ];

    const output = formatValidationResults(results);

    expect(output).toContain("✗");
    expect(output).toContain("ERROR:");
    expect(output).toContain("0 passed, 1 failed");
  });
});
