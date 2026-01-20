import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { CascadingResolver } from "../resolver/index.js";

describe("CascadingResolver", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gen-md-resolver-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("resolve", () => {
    it("should resolve a single file without cascade", async () => {
      const genMdPath = path.join(tempDir, "test.gen.md");
      await fs.writeFile(
        genMdPath,
        `---
name: "Test"
skills: ["skill1"]
output: "test.md"
---
<input>
Generate test.
</input>
`
      );

      const resolver = new CascadingResolver();
      const result = await resolver.resolve(genMdPath);

      expect(result.chain).toHaveLength(1);
      expect(result.frontmatter.name).toBe("Test");
      expect(result.frontmatter.skills).toEqual(["skill1"]);
    });

    it("should cascade from parent .gen.md file", async () => {
      // Create directory structure
      const subDir = path.join(tempDir, "packages");
      await fs.mkdir(subDir, { recursive: true });

      // Root .gen.md
      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
skills: ["root-skill"]
context: ["./root.json"]
---
<input>
Root instructions.
</input>
`
      );

      // Child .gen.md
      await fs.writeFile(
        path.join(subDir, "child.gen.md"),
        `---
name: "Child"
skills: ["child-skill"]
output: "output.md"
---
<input>
Child instructions.
</input>
`
      );

      const resolver = new CascadingResolver();
      const result = await resolver.resolve(path.join(subDir, "child.gen.md"));

      expect(result.chain).toHaveLength(2);
      expect(result.frontmatter.name).toBe("Child");
      // Skills should be deduplicated and merged
      expect(result.frontmatter.skills).toContain("root-skill");
      expect(result.frontmatter.skills).toContain("child-skill");
      // Body should be appended
      expect(result.body).toContain("Root instructions");
      expect(result.body).toContain("Child instructions");
    });

    it("should handle three-level cascade", async () => {
      // Create directory structure
      const level1 = path.join(tempDir, "level1");
      const level2 = path.join(level1, "level2");
      await fs.mkdir(level2, { recursive: true });

      // Root .gen.md
      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
skills: ["base"]
---
<input>Base</input>
`
      );

      // Level 1 .gen.md
      await fs.writeFile(
        path.join(level1, ".gen.md"),
        `---
skills: ["level1"]
---
<input>Level 1</input>
`
      );

      // Level 2 target
      await fs.writeFile(
        path.join(level2, "target.gen.md"),
        `---
skills: ["level2"]
output: "target.md"
---
<input>Level 2</input>
`
      );

      const resolver = new CascadingResolver();
      const result = await resolver.resolve(path.join(level2, "target.gen.md"));

      expect(result.chain).toHaveLength(3);
      expect(result.frontmatter.skills).toContain("base");
      expect(result.frontmatter.skills).toContain("level1");
      expect(result.frontmatter.skills).toContain("level2");
    });

    it("should respect stopAt option", async () => {
      const subDir = path.join(tempDir, "packages");
      await fs.mkdir(subDir, { recursive: true });

      // Root .gen.md (should be ignored)
      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
skills: ["root"]
---
<input>Root</input>
`
      );

      // Child .gen.md
      await fs.writeFile(
        path.join(subDir, "child.gen.md"),
        `---
skills: ["child"]
---
<input>Child</input>
`
      );

      const resolver = new CascadingResolver({ stopAt: subDir });
      const result = await resolver.resolve(path.join(subDir, "child.gen.md"));

      // Should only include child, not root
      expect(result.chain).toHaveLength(1);
      expect(result.frontmatter.skills).toEqual(["child"]);
    });

    it("should respect maxDepth option", async () => {
      // Create deep directory structure
      let currentDir = tempDir;
      for (let i = 0; i < 5; i++) {
        currentDir = path.join(currentDir, `level${i}`);
        await fs.mkdir(currentDir, { recursive: true });
        await fs.writeFile(
          path.join(currentDir, ".gen.md"),
          `---
skills: ["level${i}"]
---
<input>Level ${i}</input>
`
        );
      }

      const targetPath = path.join(currentDir, "target.gen.md");
      await fs.writeFile(
        targetPath,
        `---
skills: ["target"]
---
<input>Target</input>
`
      );

      const resolver = new CascadingResolver({ maxDepth: 2 });
      const result = await resolver.resolve(targetPath);

      // Should be limited by maxDepth
      expect(result.chain.length).toBeLessThanOrEqual(3);
    });

    it("should deduplicate skills by default", async () => {
      const subDir = path.join(tempDir, "sub");
      await fs.mkdir(subDir);

      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
skills: ["common", "root-only"]
---
<input>Root</input>
`
      );

      await fs.writeFile(
        path.join(subDir, "child.gen.md"),
        `---
skills: ["common", "child-only"]
---
<input>Child</input>
`
      );

      const resolver = new CascadingResolver();
      const result = await resolver.resolve(path.join(subDir, "child.gen.md"));

      // "common" should appear only once
      const commonCount = result.frontmatter.skills!.filter(
        (s) => s === "common"
      ).length;
      expect(commonCount).toBe(1);
    });
  });

  describe("merge strategies", () => {
    it("should use concatenate strategy for arrays", async () => {
      const subDir = path.join(tempDir, "sub");
      await fs.mkdir(subDir);

      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
context: ["a.json"]
---
<input>Root</input>
`
      );

      await fs.writeFile(
        path.join(subDir, "child.gen.md"),
        `---
context: ["b.json"]
---
<input>Child</input>
`
      );

      const resolver = new CascadingResolver({ contextMerge: "concatenate" });
      const result = await resolver.resolve(path.join(subDir, "child.gen.md"));

      expect(result.frontmatter.context).toEqual(["a.json", "b.json"]);
    });

    it("should use replace strategy when specified", async () => {
      const subDir = path.join(tempDir, "sub");
      await fs.mkdir(subDir);

      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
skills: ["parent-skill"]
---
<input>Root</input>
`
      );

      await fs.writeFile(
        path.join(subDir, "child.gen.md"),
        `---
skills: ["child-skill"]
---
<input>Child</input>
`
      );

      const resolver = new CascadingResolver({ skillsMerge: "replace" });
      const result = await resolver.resolve(path.join(subDir, "child.gen.md"));

      expect(result.frontmatter.skills).toEqual(["child-skill"]);
    });

    it("should prepend body when strategy is prepend", async () => {
      const subDir = path.join(tempDir, "sub");
      await fs.mkdir(subDir);

      await fs.writeFile(
        path.join(tempDir, ".gen.md"),
        `---
name: "root"
---
<input>PARENT</input>
`
      );

      await fs.writeFile(
        path.join(subDir, "child.gen.md"),
        `---
name: "child"
---
<input>CHILD</input>
`
      );

      const resolver = new CascadingResolver({ bodyMerge: "prepend" });
      const result = await resolver.resolve(path.join(subDir, "child.gen.md"));

      // Child should come before parent
      const childIndex = result.body.indexOf("CHILD");
      const parentIndex = result.body.indexOf("PARENT");
      expect(childIndex).toBeLessThan(parentIndex);
    });
  });
});
