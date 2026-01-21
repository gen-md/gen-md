import { describe, it, expect } from "vitest";
import { GenMdParser } from "../parser/index.js";

describe("GenMdParser", () => {
  const parser = new GenMdParser();

  describe("parseContent", () => {
    it("should parse a complete .gen.md file", () => {
      const content = `---
name: "Test Generator"
description: "A test generator"
context: ["./data.json"]
skills: ["./skill.md"]
output: "output.md"
---
Generate a test file.
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.name).toBe("Test Generator");
      expect(result.frontmatter.description).toBe("A test generator");
      expect(result.frontmatter.context).toEqual(["./data.json"]);
      expect(result.frontmatter.skills).toEqual(["./skill.md"]);
      expect(result.frontmatter.output).toBe("output.md");
      expect(result.body).toBe("Generate a test file.");
      expect(result.examples).toEqual([]);
    });

    it("should handle files without frontmatter", () => {
      const content = `Just body content.
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe("Just body content.");
    });

    it("should handle files with plain body content", () => {
      const content = `---
name: "Test"
---
Plain body content without tags.
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.name).toBe("Test");
      expect(result.body).toBe("Plain body content without tags.");
    });

    it("should normalize single values to arrays", () => {
      const content = `---
context: "./single.json"
skills: "./single.md"
---
Body
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.context).toEqual(["./single.json"]);
      expect(result.frontmatter.skills).toEqual(["./single.md"]);
    });

    it("should handle files with empty body", () => {
      const content = `---
name: "Empty"
---
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.name).toBe("Empty");
      expect(result.body).toBe("");
    });

    it("should preserve multi-line body content", () => {
      const content = `---
name: "Multi-line"
---
Line 1
Line 2
Line 3
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.body).toBe("Line 1\nLine 2\nLine 3");
    });

    it("should handle extra frontmatter fields", () => {
      const content = `---
name: "Test"
customField: "custom value"
nested:
  key: value
---
Body
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.name).toBe("Test");
      expect(result.frontmatter.customField).toBe("custom value");
      expect(result.frontmatter.nested).toEqual({ key: "value" });
    });

    it("should parse example blocks", () => {
      const content = `---
name: "Test"
---
<example>
Create a button
---
const btn = <button />;
</example>

Body content here.
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.examples).toHaveLength(1);
      expect(result.examples[0].input).toBe("Create a button");
      expect(result.examples[0].output).toBe("const btn = <button />;");
      expect(result.body).toBe("Body content here.");
    });

    it("should parse multiple example blocks", () => {
      const content = `---
name: "Test"
---
<example>
Input 1
---
Output 1
</example>

<example>
Input 2
---
Output 2
</example>

Main body.
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.examples).toHaveLength(2);
      expect(result.examples[0].input).toBe("Input 1");
      expect(result.examples[0].output).toBe("Output 1");
      expect(result.examples[1].input).toBe("Input 2");
      expect(result.examples[1].output).toBe("Output 2");
      expect(result.body).toBe("Main body.");
    });
  });
});
