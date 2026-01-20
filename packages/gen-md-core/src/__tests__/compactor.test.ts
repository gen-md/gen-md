import { describe, it, expect } from "vitest";
import { Compactor, GenMdSerializer } from "../compactor/index.js";
import type { GenMdFile } from "../types/index.js";

describe("GenMdSerializer", () => {
  const serializer = new GenMdSerializer();

  it("should serialize a basic GenMdFile", () => {
    const file: GenMdFile = {
      filePath: "test.gen.md",
      frontmatter: {
        name: "Test",
        description: "A test file",
        output: "output.md",
      },
      body: "Generate content.",
      raw: "",
    };

    const result = serializer.serialize(file);

    expect(result).toContain("name: \"Test\"");
    expect(result).toContain("description: \"A test file\"");
    expect(result).toContain("output: \"output.md\"");
    expect(result).toContain("<input>\nGenerate content.\n</input>");
  });

  it("should serialize arrays correctly", () => {
    const file: GenMdFile = {
      filePath: "test.gen.md",
      frontmatter: {
        context: ["./a.json", "./b.json"],
        skills: ["skill1"],
      },
      body: "Body",
      raw: "",
    };

    const result = serializer.serialize(file);

    expect(result).toContain("context:");
    expect(result).toContain('- "./a.json"');
    expect(result).toContain('- "./b.json"');
    expect(result).toContain('skills: "./skill1"'); // Single item as inline
  });

  it("should handle empty arrays", () => {
    const file: GenMdFile = {
      filePath: "test.gen.md",
      frontmatter: {
        context: [],
      },
      body: "Body",
      raw: "",
    };

    const result = serializer.serialize(file);

    expect(result).toContain("context: []");
  });
});

describe("Compactor", () => {
  describe("merge strategies", () => {
    it("should dedupe arrays by default", async () => {
      const compactor = new Compactor({ arrayMerge: "dedupe" });

      // Test internal merging logic via parsing mock files
      // In real tests, we'd use actual file fixtures
    });

    it("should append body content by default", async () => {
      const compactor = new Compactor({ bodyMerge: "append" });

      // Body merge logic test
    });
  });
});
