import * as path from "node:path";
import { GenMdParser } from "../parser/index.js";
import type {
  GenMdFile,
  GenMdFrontmatter,
  CompactOptions,
  ArrayMergeStrategy,
  BodyMergeStrategy,
} from "../types/index.js";

/**
 * Compactor that merges multiple .gen.md files into a single consolidated file.
 *
 * Unlike cascading, files are explicitly ordered by the user.
 *
 * Process:
 * 1. Parse all input files
 * 2. Resolve relative paths in each file
 * 3. Merge frontmatter with configurable strategy
 * 4. Merge body content with configurable strategy
 * 5. Deduplicate context and skills
 * 6. Serialize to output format
 */
export class Compactor {
  private parser: GenMdParser;
  private options: Required<CompactOptions>;

  constructor(options: CompactOptions = {}) {
    this.parser = new GenMdParser();
    this.options = {
      arrayMerge: options.arrayMerge ?? "dedupe",
      bodyMerge: options.bodyMerge ?? "append",
      output: options.output ?? "merged.gen.md",
      resolvePaths: options.resolvePaths ?? false,
      basePath: options.basePath ?? process.cwd(),
    };
  }

  /**
   * Compact multiple .gen.md files into one
   */
  async compact(inputPaths: string[]): Promise<GenMdFile> {
    if (inputPaths.length === 0) {
      throw new Error("No input files provided");
    }

    // Parse all input files
    const parsed = await Promise.all(
      inputPaths.map((p) => this.parser.parse(path.resolve(p)))
    );

    // Resolve relative paths to absolute (based on each file's location)
    const resolved = parsed.map((file) => this.resolveRelativePaths(file));

    // Merge all configurations
    const merged = this.mergeAll(resolved);

    // Deduplicate arrays
    if (merged.frontmatter.context) {
      merged.frontmatter.context = this.deduplicateArray(
        merged.frontmatter.context
      );
    }
    if (merged.frontmatter.skills) {
      merged.frontmatter.skills = this.deduplicateArray(
        merged.frontmatter.skills
      );
    }

    // Optionally convert back to relative paths
    if (!this.options.resolvePaths && this.options.basePath) {
      if (merged.frontmatter.context) {
        merged.frontmatter.context = merged.frontmatter.context.map((p) =>
          this.toRelativePath(p, this.options.basePath)
        );
      }
      if (merged.frontmatter.skills) {
        merged.frontmatter.skills = merged.frontmatter.skills.map((p) =>
          this.toRelativePath(p, this.options.basePath)
        );
      }
    }

    return merged;
  }

  /**
   * Resolve relative paths in a GenMdFile to absolute
   */
  private resolveRelativePaths(file: GenMdFile): GenMdFile {
    const baseDir = path.dirname(file.filePath);

    const resolvedFrontmatter: GenMdFrontmatter = { ...file.frontmatter };

    if (resolvedFrontmatter.context) {
      resolvedFrontmatter.context = resolvedFrontmatter.context.map((p) =>
        path.isAbsolute(p) ? p : path.resolve(baseDir, p)
      );
    }

    if (resolvedFrontmatter.skills) {
      resolvedFrontmatter.skills = resolvedFrontmatter.skills.map((p) =>
        path.isAbsolute(p) ? p : path.resolve(baseDir, p)
      );
    }

    return {
      ...file,
      frontmatter: resolvedFrontmatter,
    };
  }

  /**
   * Convert absolute path to relative
   */
  private toRelativePath(absolutePath: string, basePath: string): string {
    const relative = path.relative(basePath, absolutePath);
    // Ensure paths start with ./ for clarity
    if (!relative.startsWith(".") && !relative.startsWith("/")) {
      return `./${relative}`;
    }
    return relative;
  }

  /**
   * Merge all parsed files into one
   */
  private mergeAll(files: GenMdFile[]): GenMdFile {
    const [first, ...rest] = files;

    let merged: GenMdFrontmatter = { ...first.frontmatter };
    let mergedBody = first.body;

    for (const file of rest) {
      merged = this.mergeFrontmatter(merged, file.frontmatter);
      mergedBody = this.mergeBody(mergedBody, file.body);
    }

    return {
      filePath: this.options.output,
      frontmatter: merged,
      body: mergedBody,
      raw: "", // Will be regenerated on serialize
    };
  }

  /**
   * Merge two frontmatter objects
   */
  private mergeFrontmatter(
    parent: GenMdFrontmatter,
    child: GenMdFrontmatter
  ): GenMdFrontmatter {
    const result: GenMdFrontmatter = { ...parent };

    for (const [key, value] of Object.entries(child)) {
      if (value === undefined) continue;

      if (Array.isArray(value) && Array.isArray(parent[key])) {
        result[key] = this.mergeArrays(
          parent[key] as unknown[],
          value,
          this.options.arrayMerge
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
   * Deduplicate array preserving order (first occurrence wins)
   */
  private deduplicateArray<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }
}

/**
 * Serializer for GenMdFile to .gen.md format
 */
export class GenMdSerializer {
  /**
   * Convert GenMdFile to string representation
   */
  serialize(file: GenMdFile): string {
    const frontmatter = this.serializeFrontmatter(file.frontmatter);
    const body = file.body.trim();

    return `---\n${frontmatter}---\n<input>\n${body}\n</input>\n`;
  }

  /**
   * Serialize frontmatter to YAML
   */
  private serializeFrontmatter(fm: GenMdFrontmatter): string {
    const lines: string[] = [];

    // Output in canonical order
    const order = ["name", "description", "context", "skills", "prompt", "output"];

    for (const key of order) {
      if (fm[key] !== undefined) {
        lines.push(this.serializeField(key, fm[key]));
      }
    }

    // Output any additional fields
    for (const [key, value] of Object.entries(fm)) {
      if (!order.includes(key) && value !== undefined) {
        lines.push(this.serializeField(key, value));
      }
    }

    return lines.join("\n") + "\n";
  }

  /**
   * Serialize a single field
   */
  private serializeField(key: string, value: unknown): string {
    if (Array.isArray(value)) {
      if (value.length === 0) return `${key}: []`;
      if (value.length === 1) return `${key}: ${JSON.stringify(value[0])}`;
      return `${key}:\n${value.map((v) => `  - ${JSON.stringify(v)}`).join("\n")}`;
    }

    if (typeof value === "string" && value.includes("\n")) {
      return `${key}: |\n  ${value.split("\n").join("\n  ")}`;
    }

    return `${key}: ${JSON.stringify(value)}`;
  }
}

// Export factory functions
export function createCompactor(options?: CompactOptions): Compactor {
  return new Compactor(options);
}

export function createSerializer(): GenMdSerializer {
  return new GenMdSerializer();
}
