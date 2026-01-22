import { describe, it, expect } from "vitest";
import { validateOutput } from "../../src/validation/index.js";

describe("Output Validation", () => {
  describe("Common Validations", () => {
    it("should reject empty output", () => {
      const result = validateOutput("", { type: "file" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Empty output");
    });

    it("should reject whitespace-only output", () => {
      const result = validateOutput("   \n\t  ", { type: "file" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Empty output");
    });

    it("should warn about code fences in output", () => {
      const result = validateOutput("```ts\ncode\n```", { type: "file" });
      expect(result.warnings).toContain("Output contains markdown code fences");
    });

    it("should reject conversational preamble - Sure", () => {
      const result = validateOutput("Sure, here is the code:\nfunction test() {}", {
        type: "file",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Output contains conversational preamble");
    });

    it("should reject conversational preamble - Here", () => {
      const result = validateOutput("Here is the implementation:\nfunction test() {}", {
        type: "file",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Output contains conversational preamble");
    });

    it("should reject conversational preamble - I'll", () => {
      const result = validateOutput("I'll help you with that:\nfunction test() {}", {
        type: "file",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Output contains conversational preamble");
    });

    it("should reject conversational preamble - Of course", () => {
      const result = validateOutput("Of course! Here's the code:\nfunction test() {}", {
        type: "file",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Output contains conversational preamble");
    });
  });

  describe("File Output", () => {
    it("should accept valid TypeScript code", () => {
      const content = `export function add(a: number, b: number): number {
  return a + b;
}`;
      const result = validateOutput(content, { type: "file", filePath: "test.ts" });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect unbalanced braces in TypeScript", () => {
      const result = validateOutput("function test() {", { type: "file", filePath: "test.ts" });
      expect(result.errors.some((e) => e.includes("Unbalanced braces"))).toBe(true);
    });

    it("should detect unbalanced parentheses", () => {
      const result = validateOutput("function test(a, b {}", { type: "file", filePath: "test.ts" });
      expect(result.errors.some((e) => e.includes("Unbalanced parentheses"))).toBe(true);
    });

    it("should detect unbalanced brackets", () => {
      const result = validateOutput("const arr = [1, 2, 3;", { type: "file", filePath: "test.ts" });
      expect(result.errors.some((e) => e.includes("Unbalanced brackets"))).toBe(true);
    });

    it("should validate JSON files", () => {
      const result = validateOutput('{ "key": "value" }', { type: "file", filePath: "config.json" });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid JSON files", () => {
      const result = validateOutput("{ invalid json", { type: "file", filePath: "config.json" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid JSON"))).toBe(true);
    });

    it("should detect unclosed code blocks in markdown", () => {
      const result = validateOutput("# Title\n```ts\ncode", { type: "file", filePath: "README.md" });
      expect(result.errors).toContain("Unclosed code block in markdown");
    });

    it("should warn about tabs in YAML files", () => {
      const result = validateOutput("key:\n\tvalue", { type: "file", filePath: "config.yaml" });
      expect(result.warnings).toContain("YAML file contains tabs (should use spaces)");
    });

    it("should use expectedExtension over filePath", () => {
      const result = validateOutput("{ invalid", {
        type: "file",
        filePath: "file.txt",
        expectedExtension: "json",
      });
      expect(result.errors.some((e) => e.includes("Invalid JSON"))).toBe(true);
    });
  });

  describe("Plan Output", () => {
    it("should accept valid plan JSON", () => {
      const plan = JSON.stringify({
        files: [{ path: "src/test.ts", action: "create", description: "Test file" }],
      });
      const result = validateOutput(plan, { type: "plan" });
      expect(result.valid).toBe(true);
    });

    it("should reject plan without files array", () => {
      const result = validateOutput("{}", { type: "plan" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plan missing "files" array');
    });

    it("should reject plan with non-array files", () => {
      const result = validateOutput('{"files": "not-an-array"}', { type: "plan" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plan missing "files" array');
    });

    it("should reject plan file entry without path", () => {
      const plan = JSON.stringify({
        files: [{ action: "create", description: "Test" }],
      });
      const result = validateOutput(plan, { type: "plan" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plan file entry missing "path"');
    });

    it("should reject plan file entry without action", () => {
      const plan = JSON.stringify({
        files: [{ path: "src/test.ts", description: "Test" }],
      });
      const result = validateOutput(plan, { type: "plan" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Plan file entry missing "action"');
    });

    it("should warn about unknown actions", () => {
      const plan = JSON.stringify({
        files: [{ path: "src/test.ts", action: "delete", description: "Test" }],
      });
      const result = validateOutput(plan, { type: "plan" });
      expect(result.warnings).toContain("Unknown action: delete");
    });

    it("should reject invalid JSON", () => {
      const result = validateOutput("{ not valid json", { type: "plan" });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Plan is not valid JSON"))).toBe(true);
    });
  });

  describe("Spec Output", () => {
    it("should accept valid spec", () => {
      const spec = `---
output: README.md
context:
  - ./package.json
---

Generate a README.`;
      const result = validateOutput(spec, { type: "spec" });
      expect(result.valid).toBe(true);
    });

    it("should require YAML frontmatter", () => {
      const result = validateOutput("No frontmatter here", { type: "spec" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Spec must start with YAML frontmatter (---)");
    });

    it("should require output field", () => {
      const result = validateOutput("---\ncontext: []\n---\nInstructions", { type: "spec" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Spec missing required "output" field');
    });

    it("should require closing frontmatter delimiter", () => {
      const result = validateOutput("---\noutput: test.md\nNo closing", { type: "spec" });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Spec missing closing frontmatter delimiter (---)");
    });

    it("should warn about empty body", () => {
      const result = validateOutput("---\noutput: test.md\n---", { type: "spec" });
      expect(result.warnings).toContain("Spec has no instructions after frontmatter");
    });
  });
});
