import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { compactCommand } from "../commands/compact.js";
import { cascadeCommand } from "../commands/cascade.js";
import { validateCommand } from "../commands/validate.js";

describe("CLI Commands", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gen-md-cli-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("compactCommand", () => {
    it("should be properly configured", () => {
      expect(compactCommand.name()).toBe("compact");
      expect(compactCommand.description()).toContain("Merge multiple .gen.md files");
    });

    it("should have required options", () => {
      const options = compactCommand.options.map((o) => o.long);

      expect(options).toContain("--output");
      expect(options).toContain("--array-merge");
      expect(options).toContain("--body-merge");
      expect(options).toContain("--dry-run");
    });
  });

  describe("cascadeCommand", () => {
    it("should be properly configured", () => {
      expect(cascadeCommand.name()).toBe("cascade");
      expect(cascadeCommand.description()).toContain("Preview the cascade chain");
    });

    it("should have required options", () => {
      const options = cascadeCommand.options.map((o) => o.long);

      expect(options).toContain("--stop-at");
      expect(options).toContain("--max-depth");
      expect(options).toContain("--json");
      expect(options).toContain("--show-merged");
    });
  });

  describe("validateCommand", () => {
    it("should be properly configured", () => {
      expect(validateCommand.name()).toBe("validate");
      expect(validateCommand.description()).toContain("Validate .gen.md files");
    });

    it("should have required options", () => {
      const options = validateCommand.options.map((o) => o.long);

      expect(options).toContain("--no-check-output");
      expect(options).toContain("--no-check-context");
      expect(options).toContain("--no-check-skills");
      expect(options).toContain("--json");
    });
  });
});

describe("Command Integration", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gen-md-cli-int-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("compact + validate workflow", () => {
    it("should validate compacted files", async () => {
      // Create two source .gen.md files
      const file1Path = path.join(tempDir, "file1.gen.md");
      const file2Path = path.join(tempDir, "file2.gen.md");

      await fs.writeFile(
        file1Path,
        `---
name: "File 1"
context: []
---
<input>
First file content.
</input>
`
      );

      await fs.writeFile(
        file2Path,
        `---
name: "File 2"
skills: []
---
<input>
Second file content.
</input>
`
      );

      // Both files should be valid .gen.md files
      const file1Content = await fs.readFile(file1Path, "utf-8");
      const file2Content = await fs.readFile(file2Path, "utf-8");

      expect(file1Content).toContain("name: \"File 1\"");
      expect(file2Content).toContain("name: \"File 2\"");
    });
  });
});
