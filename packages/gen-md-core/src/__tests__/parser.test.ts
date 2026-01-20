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
<input>
Generate a test file.
</input>
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.name).toBe("Test Generator");
      expect(result.frontmatter.description).toBe("A test generator");
      expect(result.frontmatter.context).toEqual(["./data.json"]);
      expect(result.frontmatter.skills).toEqual(["./skill.md"]);
      expect(result.frontmatter.output).toBe("output.md");
      expect(result.body).toBe("Generate a test file.");
    });

    it("should handle files without frontmatter", () => {
      const content = `<input>
Just body content.
</input>
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe("Just body content.");
    });

    it("should handle files without input tags", () => {
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
<input>
Body
</input>
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.context).toEqual(["./single.json"]);
      expect(result.frontmatter.skills).toEqual(["./single.md"]);
    });

    it("should handle empty files", () => {
      const content = `---
---
<input>
</input>
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe("");
    });

    it("should preserve multi-line body content", () => {
      const content = `---
name: "Multi-line"
---
<input>
Line 1
Line 2
Line 3
</input>
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
<input>
Body
</input>
`;

      const result = parser.parseContent(content, "test.gen.md");

      expect(result.frontmatter.name).toBe("Test");
      expect(result.frontmatter.customField).toBe("custom value");
      expect(result.frontmatter.nested).toEqual({ key: "value" });
    });
  });
});
