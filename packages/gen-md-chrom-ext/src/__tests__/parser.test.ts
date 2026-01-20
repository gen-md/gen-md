import { describe, it, expect } from "vitest";
import { parseGenMd, parseFrontmatter, extractInputBlock } from "../parser";

describe("parseFrontmatter", () => {
  it("should parse simple key-value pairs", () => {
    const yaml = `name: test
description: A test file`;
    const result = parseFrontmatter(yaml);

    expect(result.name).toBe("test");
    expect(result.description).toBe("A test file");
  });

  it("should parse inline arrays", () => {
    const yaml = `skills: [skill1, skill2, skill3]`;
    const result = parseFrontmatter(yaml);

    expect(result.skills).toEqual(["skill1", "skill2", "skill3"]);
  });

  it("should parse multiline arrays", () => {
    const yaml = `context:
  - file1.ts
  - file2.ts
  - file3.ts`;
    const result = parseFrontmatter(yaml);

    expect(result.context).toEqual(["file1.ts", "file2.ts", "file3.ts"]);
  });

  it("should handle quoted values", () => {
    const yaml = `name: "quoted value"
description: 'single quoted'`;
    const result = parseFrontmatter(yaml);

    expect(result.name).toBe("quoted value");
    expect(result.description).toBe("single quoted");
  });

  it("should handle empty arrays", () => {
    const yaml = `skills: []`;
    const result = parseFrontmatter(yaml);

    expect(result.skills).toEqual([]);
  });
});

describe("parseGenMd", () => {
  it("should parse a valid .gen.md file", () => {
    const content = `---
name: test-file
description: A test configuration
skills:
  - skill1
  - skill2
---
<input>
This is the input block.
</input>`;

    const result = parseGenMd(content);

    expect(result.isValid).toBe(true);
    expect(result.frontmatter.name).toBe("test-file");
    expect(result.frontmatter.description).toBe("A test configuration");
    expect(result.frontmatter.skills).toEqual(["skill1", "skill2"]);
    expect(result.body).toContain("<input>");
  });

  it("should report error for missing frontmatter", () => {
    const content = `Just some text without frontmatter`;
    const result = parseGenMd(content);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Missing frontmatter: file must start with ---"
    );
  });

  it("should report error for unclosed frontmatter", () => {
    const content = `---
name: test
This is missing closing delimiter`;
    const result = parseGenMd(content);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid frontmatter: missing closing ---");
  });

  it("should handle files with only frontmatter", () => {
    const content = `---
name: minimal
---`;

    const result = parseGenMd(content);

    expect(result.frontmatter.name).toBe("minimal");
    expect(result.body).toBe("");
  });
});

describe("extractInputBlock", () => {
  it("should extract input block content", () => {
    const body = `Some text before
<input>
This is the input content.
With multiple lines.
</input>
Some text after`;

    const result = extractInputBlock(body);

    expect(result).toBe("This is the input content.\nWith multiple lines.");
  });

  it("should return null if no input block", () => {
    const body = `Just some regular text`;
    const result = extractInputBlock(body);

    expect(result).toBeNull();
  });

  it("should handle empty input blocks", () => {
    const body = `<input></input>`;
    const result = extractInputBlock(body);

    expect(result).toBe("");
  });
});
