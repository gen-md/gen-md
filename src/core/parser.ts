/**
 * .gitgen.md File Parser
 *
 * Parses .gitgen.md files with YAML frontmatter and extracts one-shot examples.
 */

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import matter from "gray-matter";
import type { GenMdFile, GenMdFrontmatter, OneShotExample } from "../types.js";

/**
 * Regular expression to match <example> blocks
 * Format: <example>input\n---\noutput</example>
 */
const EXAMPLE_REGEX = /<example>([\s\S]*?)<\/example>/g;
const EXAMPLE_SEPARATOR = /\n---\n/;

/**
 * Parser for .gitgen.md files
 */
export class GenMdParser {
  /**
   * Parse a .gitgen.md file from a path
   */
  async parse(filePath: string): Promise<GenMdFile> {
    const absolutePath = resolve(filePath);
    const content = await readFile(absolutePath, "utf-8");
    return this.parseContent(content, absolutePath);
  }

  /**
   * Parse .gitgen.md content directly
   */
  parseContent(content: string, filePath: string): GenMdFile {
    const absolutePath = resolve(filePath);

    // Parse YAML frontmatter
    const { data, content: body } = matter(content);
    const frontmatter = this.normalizeFrontmatter(data as GenMdFrontmatter);

    // Extract examples from body
    const { examples, cleanBody } = this.extractExamples(body);

    return {
      filePath: absolutePath,
      frontmatter,
      body: cleanBody.trim(),
      examples,
      raw: content,
    };
  }

  /**
   * Normalize frontmatter - ensure arrays are arrays
   */
  private normalizeFrontmatter(
    data: GenMdFrontmatter
  ): GenMdFrontmatter {
    const normalized: GenMdFrontmatter = { ...data };

    // Ensure context is an array
    if (normalized.context !== undefined) {
      normalized.context = Array.isArray(normalized.context)
        ? normalized.context
        : [normalized.context];
    }

    // Ensure skills is an array
    if (normalized.skills !== undefined) {
      normalized.skills = Array.isArray(normalized.skills)
        ? normalized.skills
        : [normalized.skills];
    }

    return normalized;
  }

  /**
   * Extract <example> blocks from body
   */
  private extractExamples(body: string): {
    examples: OneShotExample[];
    cleanBody: string;
  } {
    const examples: OneShotExample[] = [];
    let match: RegExpExecArray | null;

    // Find all example blocks
    while ((match = EXAMPLE_REGEX.exec(body)) !== null) {
      const exampleContent = match[1].trim();
      const parts = exampleContent.split(EXAMPLE_SEPARATOR);

      if (parts.length >= 2) {
        examples.push({
          input: parts[0].trim(),
          output: parts.slice(1).join("\n---\n").trim(),
        });
      } else {
        // Single part - treat as input with empty output
        examples.push({
          input: exampleContent,
          output: "",
        });
      }
    }

    // Remove example blocks from body
    const cleanBody = body.replace(EXAMPLE_REGEX, "").trim();

    return { examples, cleanBody };
  }

  /**
   * Resolve relative paths in frontmatter to absolute paths
   */
  resolveRelativePaths(file: GenMdFile): GenMdFile {
    const dir = dirname(file.filePath);
    const frontmatter = { ...file.frontmatter };

    // Resolve context paths
    if (frontmatter.context) {
      frontmatter.context = frontmatter.context.map((p) =>
        p.startsWith("/") ? p : resolve(dir, p)
      );
    }

    // Resolve skills paths
    if (frontmatter.skills) {
      frontmatter.skills = frontmatter.skills.map((p) =>
        p.startsWith("/") ? p : resolve(dir, p)
      );
    }

    // Resolve output path
    if (frontmatter.output) {
      frontmatter.output = frontmatter.output.startsWith("/")
        ? frontmatter.output
        : resolve(dir, frontmatter.output);
    }

    return {
      ...file,
      frontmatter,
    };
  }
}

/**
 * Create a parser instance
 */
export function createParser(): GenMdParser {
  return new GenMdParser();
}
