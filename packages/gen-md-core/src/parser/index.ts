import * as fs from "node:fs/promises";
import * as path from "node:path";
import yaml from "js-yaml";
import type { GenMdFile, GenMdFrontmatter } from "../types/index.js";

/**
 * Parser for .gen.md files
 */
export class GenMdParser {
  /**
   * Parse a .gen.md file from path
   */
  async parse(filePath: string): Promise<GenMdFile> {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, "utf-8");
    return this.parseContent(content, absolutePath);
  }

  /**
   * Parse .gen.md content string
   */
  parseContent(content: string, filePath: string = "unknown"): GenMdFile {
    const { frontmatter, body } = this.splitFrontmatterAndBody(content);

    return {
      filePath: path.resolve(filePath),
      frontmatter: this.parseFrontmatter(frontmatter),
      body: this.parseBody(body),
      raw: content,
    };
  }

  /**
   * Split content into frontmatter and body
   */
  private splitFrontmatterAndBody(content: string): {
    frontmatter: string;
    body: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      // No frontmatter, entire content is body
      return { frontmatter: "", body: content };
    }

    return {
      frontmatter: match[1],
      body: match[2],
    };
  }

  /**
   * Parse YAML frontmatter
   */
  private parseFrontmatter(frontmatter: string): GenMdFrontmatter {
    if (!frontmatter.trim()) {
      return {};
    }

    try {
      const parsed = yaml.load(frontmatter) as GenMdFrontmatter;

      // Normalize arrays (single values to arrays)
      if (parsed.context && !Array.isArray(parsed.context)) {
        parsed.context = [parsed.context as unknown as string];
      }
      if (parsed.skills && !Array.isArray(parsed.skills)) {
        parsed.skills = [parsed.skills as unknown as string];
      }

      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse frontmatter: ${message}`);
    }
  }

  /**
   * Parse body content, extracting <input> section if present
   */
  private parseBody(body: string): string {
    // Extract content from <input>...</input> tags
    const inputRegex = /<input>([\s\S]*?)<\/input>/;
    const match = body.match(inputRegex);

    if (match) {
      return match[1].trim();
    }

    // No <input> tags, return entire body
    return body.trim();
  }
}

// Export singleton instance for convenience
export const parser = new GenMdParser();
