import * as fs from "node:fs/promises";
import * as path from "node:path";
import yaml from "js-yaml";
import type {
  GenMdFile,
  GenMdFrontmatter,
  OneShotExample,
} from "../types/index.js";

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
    const { examples, remainingBody } = this.parseExamples(body);

    return {
      filePath: path.resolve(filePath),
      frontmatter: this.parseFrontmatter(frontmatter),
      body: remainingBody,
      examples,
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
   * Parse <example> blocks from body content.
   * Example format:
   * <example>
   * input content
   * ---
   * output content
   * </example>
   */
  private parseExamples(body: string): {
    examples: OneShotExample[];
    remainingBody: string;
  } {
    const examples: OneShotExample[] = [];

    // Match all <example>...</example> blocks
    const exampleRegex = /<example>([\s\S]*?)<\/example>/g;

    let remainingBody = body;
    let match;

    while ((match = exampleRegex.exec(body)) !== null) {
      const exampleContent = match[1].trim();

      // Split on --- separator (first occurrence only)
      const separatorIndex = exampleContent.indexOf("\n---\n");

      if (separatorIndex !== -1) {
        const input = exampleContent.substring(0, separatorIndex).trim();
        const output = exampleContent.substring(separatorIndex + 5).trim();

        examples.push({ input, output });
      } else {
        // No separator found, treat entire content as input with empty output
        examples.push({ input: exampleContent, output: "" });
      }
    }

    // Remove all <example> blocks from body
    remainingBody = body.replace(exampleRegex, "").trim();

    return { examples, remainingBody };
  }
}

// Export singleton instance for convenience
export const parser = new GenMdParser();
