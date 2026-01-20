import * as fs from "node:fs/promises";
import * as path from "node:path";
import { GenMdParser } from "../parser/index.js";
import type {
  GenMdFile,
  GenMdFrontmatter,
  ResolvedGenMdConfig,
  CascadeOptions,
  ArrayMergeStrategy,
  BodyMergeStrategy,
} from "../types/index.js";

/**
 * Cascading resolver that walks directory tree upward collecting .gen.md files
 * and merges their configurations.
 *
 * Example:
 *   /project/.gen.md              (root level)
 *   /project/packages/.gen.md     (packages level)
 *   /project/packages/cli/app.gen.md (target)
 *
 * Cascade chain: [root, packages, target]
 * Merge order: root → packages → target (child overrides parent)
 */
export class CascadingResolver {
  private parser: GenMdParser;
  private options: Required<CascadeOptions>;

  constructor(options: CascadeOptions = {}) {
    this.parser = new GenMdParser();
    this.options = {
      contextMerge: options.contextMerge ?? "dedupe",
      skillsMerge: options.skillsMerge ?? "dedupe",
      bodyMerge: options.bodyMerge ?? "append",
      stopAt: options.stopAt ?? "",
      maxDepth: options.maxDepth ?? 10,
    };
  }

  /**
   * Resolve cascade chain for a target .gen.md file
   */
  async resolve(targetPath: string): Promise<ResolvedGenMdConfig> {
    const absoluteTarget = path.resolve(targetPath);

    // Collect cascade chain (root to leaf)
    const chainPaths = await this.collectCascadeChain(absoluteTarget);

    // Parse all files in chain
    const chain = await Promise.all(
      chainPaths.map((filePath) => this.parser.parse(filePath))
    );

    // Merge configurations (root to leaf)
    const { frontmatter, body } = this.mergeChain(chain);

    // Resolve relative paths in context and skills
    const targetDir = path.dirname(absoluteTarget);
    const resolvedContext = this.resolveRelativePaths(
      frontmatter.context ?? [],
      targetDir
    );
    const resolvedSkills = this.resolveRelativePaths(
      frontmatter.skills ?? [],
      targetDir
    );

    return {
      chain,
      frontmatter,
      body,
      resolvedContext,
      resolvedSkills,
    };
  }

  /**
   * Walk directory tree upward collecting .gen.md files
   */
  private async collectCascadeChain(targetPath: string): Promise<string[]> {
    const chain: string[] = [];
    const targetDir = path.dirname(targetPath);

    let currentDir = targetDir;
    let depth = 0;
    const stopAt = this.options.stopAt
      ? path.resolve(this.options.stopAt)
      : null;

    // Walk upward collecting parent .gen.md files
    while (depth < this.options.maxDepth) {
      // Look for .gen.md in current directory
      const candidate = path.join(currentDir, ".gen.md");

      // Don't include the target file itself when looking for parents
      if (candidate !== targetPath && (await this.fileExists(candidate))) {
        chain.unshift(candidate); // Prepend to maintain root->leaf order
      }

      // Stop conditions
      if (stopAt && currentDir === stopAt) break;
      if (currentDir === path.dirname(currentDir)) break; // Reached filesystem root

      // Move to parent directory
      currentDir = path.dirname(currentDir);
      depth++;
    }

    // Add target file at the end
    chain.push(targetPath);

    return chain;
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Merge a chain of parsed GenMdFiles
   */
  private mergeChain(chain: GenMdFile[]): {
    frontmatter: GenMdFrontmatter;
    body: string;
  } {
    if (chain.length === 0) {
      throw new Error("Empty cascade chain");
    }

    // Start with first (root) config
    let merged: GenMdFrontmatter = { ...chain[0].frontmatter };
    let mergedBody = chain[0].body;

    // Merge each subsequent level
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      merged = this.mergeFrontmatter(merged, current.frontmatter);
      mergedBody = this.mergeBody(mergedBody, current.body);
    }

    return { frontmatter: merged, body: mergedBody };
  }

  /**
   * Merge two frontmatter objects (parent + child)
   * Child values override parent, arrays follow merge strategy
   */
  private mergeFrontmatter(
    parent: GenMdFrontmatter,
    child: GenMdFrontmatter
  ): GenMdFrontmatter {
    const result: GenMdFrontmatter = { ...parent };

    for (const [key, value] of Object.entries(child)) {
      if (value === undefined) continue;

      if (Array.isArray(value) && Array.isArray(parent[key])) {
        // Array merge based on strategy
        const strategy =
          key === "context"
            ? this.options.contextMerge
            : key === "skills"
              ? this.options.skillsMerge
              : "concatenate";

        result[key] = this.mergeArrays(
          parent[key] as unknown[],
          value,
          strategy
        );
      } else {
        // Scalar values: child overrides parent
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Merge arrays based on strategy
   */
  private mergeArrays(
    parent: unknown[],
    child: unknown[],
    strategy: ArrayMergeStrategy
  ): unknown[] {
    switch (strategy) {
      case "replace":
        return [...child];
      case "prepend":
        return [...child, ...parent];
      case "concatenate":
        return [...parent, ...child];
      case "dedupe":
        return [...new Set([...parent, ...child])];
      case "dedupe-last": {
        // Keep last occurrence of duplicates
        const combined = [...parent, ...child];
        return combined.filter(
          (item, index) => combined.lastIndexOf(item) === index
        );
      }
      default:
        return [...parent, ...child];
    }
  }

  /**
   * Merge body content based on strategy
   */
  private mergeBody(parent: string, child: string): string {
    if (!parent.trim()) return child;
    if (!child.trim()) return parent;

    switch (this.options.bodyMerge) {
      case "replace":
        return child;
      case "prepend":
        return `${child}\n\n${parent}`;
      case "append":
      default:
        return `${parent}\n\n${child}`;
    }
  }

  /**
   * Resolve relative paths to absolute
   */
  private resolveRelativePaths(paths: string[], baseDir: string): string[] {
    return paths.map((p) => {
      if (path.isAbsolute(p)) return p;
      return path.resolve(baseDir, p);
    });
  }
}

// Export singleton factory
export function createResolver(options?: CascadeOptions): CascadingResolver {
  return new CascadingResolver(options);
}
