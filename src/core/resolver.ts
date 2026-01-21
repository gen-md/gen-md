/**
 * Cascading Resolver
 *
 * Walks up the directory tree to find and merge .gitgen.md configurations.
 * Parent configurations cascade down to children.
 */

import { dirname, join, resolve } from "node:path";
import { access, constants } from "node:fs/promises";
import { GenMdParser, createParser } from "./parser.js";
import type {
  GenMdFile,
  GenMdFrontmatter,
  OneShotExample,
  ResolvedGenMdConfig,
} from "../types.js";

/**
 * Merge strategy for arrays
 */
export type ArrayMergeStrategy =
  | "replace" // Child replaces parent
  | "prepend" // Child before parent
  | "concatenate" // Parent then child
  | "dedupe"; // Concatenate and deduplicate

/**
 * Merge strategy for body content
 */
export type BodyMergeStrategy =
  | "replace" // Child replaces parent
  | "prepend" // Child before parent
  | "append"; // Parent then child

/**
 * Options for cascade resolution
 */
export interface ResolverOptions {
  /** Maximum depth to walk up (default: 10) */
  maxDepth?: number;
  /** Stop at this directory (won't go above it) */
  stopAt?: string;
  /** Strategy for merging context arrays */
  contextMerge?: ArrayMergeStrategy;
  /** Strategy for merging skills arrays */
  skillsMerge?: ArrayMergeStrategy;
  /** Strategy for merging body content */
  bodyMerge?: BodyMergeStrategy;
}

const DEFAULT_OPTIONS: Required<ResolverOptions> = {
  maxDepth: 10,
  stopAt: "/",
  contextMerge: "dedupe",
  skillsMerge: "dedupe",
  bodyMerge: "append",
};

/**
 * Cascading resolver for .gitgen.md files
 */
export class CascadingResolver {
  private parser: GenMdParser;
  private options: Required<ResolverOptions>;
  private visited: Set<string>;

  constructor(options: ResolverOptions = {}) {
    this.parser = createParser();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.visited = new Set();
  }

  /**
   * Resolve cascade chain for a .gitgen.md file
   */
  async resolve(filePath: string): Promise<ResolvedGenMdConfig> {
    const absolutePath = resolve(filePath);
    this.visited.clear();

    // Build cascade chain (root to leaf)
    const chain = await this.buildCascadeChain(absolutePath);

    // Merge configurations
    return this.mergeChain(chain);
  }

  /**
   * Build the cascade chain by walking up directory tree
   */
  private async buildCascadeChain(leafPath: string): Promise<GenMdFile[]> {
    const chain: GenMdFile[] = [];
    const leafDir = dirname(leafPath);
    const stopAt = resolve(this.options.stopAt);

    // Collect .gitgen.md files from root to leaf
    const configPaths: string[] = [];
    let currentDir = leafDir;
    let depth = 0;

    while (depth < this.options.maxDepth) {
      // Check for circular reference (symlink loops)
      if (this.visited.has(currentDir)) {
        throw new Error(`Circular reference detected at: ${currentDir}`);
      }
      this.visited.add(currentDir);

      // Look for .gitgen.md in current directory
      const genMdPath = join(currentDir, ".gitgen.md");
      if (await this.fileExists(genMdPath)) {
        configPaths.unshift(genMdPath); // Add to front (we're going root-ward)
      }

      // Stop conditions
      if (currentDir === stopAt || currentDir === "/" || currentDir === dirname(currentDir)) {
        break;
      }

      currentDir = dirname(currentDir);
      depth++;
    }

    // Add the leaf file itself (if it's not a .gitgen.md directory config)
    if (!leafPath.endsWith("/.gitgen.md")) {
      configPaths.push(leafPath);
    }

    // Parse all files in chain
    for (const configPath of configPaths) {
      try {
        const file = await this.parser.parse(configPath);
        const resolved = this.parser.resolveRelativePaths(file);
        chain.push(resolved);
      } catch (error) {
        // Skip files that can't be parsed
        console.warn(`Warning: Could not parse ${configPath}: ${error}`);
      }
    }

    return chain;
  }

  /**
   * Merge cascade chain into single resolved config
   */
  private mergeChain(chain: GenMdFile[]): ResolvedGenMdConfig {
    if (chain.length === 0) {
      throw new Error("No .gitgen.md files found in cascade chain");
    }

    // Start with empty config
    let merged: GenMdFrontmatter = {};
    let mergedBody = "";
    let mergedExamples: OneShotExample[] = [];

    // Merge each file in chain (root to leaf)
    for (const file of chain) {
      merged = this.mergeFrontmatter(merged, file.frontmatter);
      mergedBody = this.mergeBody(mergedBody, file.body);
      mergedExamples = this.mergeExamples(mergedExamples, file.examples);
    }

    const leaf = chain[chain.length - 1];

    return {
      filePath: leaf.filePath,
      frontmatter: merged,
      body: mergedBody,
      examples: mergedExamples,
      chain,
    };
  }

  /**
   * Merge two frontmatter objects
   */
  private mergeFrontmatter(
    parent: GenMdFrontmatter,
    child: GenMdFrontmatter
  ): GenMdFrontmatter {
    const merged: GenMdFrontmatter = { ...parent };

    // Merge each field
    for (const [key, value] of Object.entries(child)) {
      if (value === undefined) continue;

      if (key === "context") {
        merged.context = this.mergeArrays(
          parent.context || [],
          value as string[],
          this.options.contextMerge
        );
      } else if (key === "skills") {
        merged.skills = this.mergeArrays(
          parent.skills || [],
          value as string[],
          this.options.skillsMerge
        );
      } else {
        // Scalar values: child overrides parent
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Merge arrays with given strategy
   */
  private mergeArrays(
    parent: string[],
    child: string[],
    strategy: ArrayMergeStrategy
  ): string[] {
    switch (strategy) {
      case "replace":
        return [...child];
      case "prepend":
        return [...child, ...parent];
      case "concatenate":
        return [...parent, ...child];
      case "dedupe":
        return this.deduplicateArray([...parent, ...child]);
      default:
        return [...parent, ...child];
    }
  }

  /**
   * Deduplicate array preserving order (first occurrence wins)
   */
  private deduplicateArray(arr: string[]): string[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }

  /**
   * Merge body content
   */
  private mergeBody(parent: string, child: string): string {
    if (!parent) return child;
    if (!child) return parent;

    switch (this.options.bodyMerge) {
      case "replace":
        return child;
      case "prepend":
        return `${child}\n\n${parent}`;
      case "append":
        return `${parent}\n\n${child}`;
      default:
        return `${parent}\n\n${child}`;
    }
  }

  /**
   * Merge examples arrays
   */
  private mergeExamples(
    parent: OneShotExample[],
    child: OneShotExample[]
  ): OneShotExample[] {
    // Always concatenate and dedupe examples by input
    const seen = new Set<string>();
    const merged: OneShotExample[] = [];

    for (const example of [...parent, ...child]) {
      const key = example.input;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(example);
      }
    }

    return merged;
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a resolver instance
 */
export function createResolver(options?: ResolverOptions): CascadingResolver {
  return new CascadingResolver(options);
}
