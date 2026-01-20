import { ParsedGenMd, GenMdFrontmatter } from "./types.js";

/**
 * Simple YAML-like frontmatter parser for browser use
 * Handles basic key-value pairs and arrays
 */
export function parseFrontmatter(content: string): GenMdFrontmatter {
  const frontmatter: GenMdFrontmatter = {};
  const lines = content.split("\n");

  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check for array item
    if (trimmed.startsWith("- ") && currentKey && currentArray) {
      const value = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
      currentArray.push(value);
      continue;
    }

    // Check for key-value pair
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      // Save previous array if exists
      if (currentKey && currentArray) {
        frontmatter[currentKey] = currentArray;
      }

      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (value === "" || value === "[]") {
        // Start of array
        currentKey = key;
        currentArray = [];
      } else if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array
        const items = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter((s) => s);
        frontmatter[key] = items;
        currentKey = null;
        currentArray = null;
      } else {
        // Simple value
        frontmatter[key] = value.replace(/^["']|["']$/g, "");
        currentKey = null;
        currentArray = null;
      }
    }
  }

  // Save last array if exists
  if (currentKey && currentArray) {
    frontmatter[currentKey] = currentArray;
  }

  return frontmatter;
}

/**
 * Parse a .gen.md file content
 */
export function parseGenMd(content: string): ParsedGenMd {
  const errors: string[] = [];

  // Check for frontmatter delimiters
  if (!content.startsWith("---")) {
    return {
      frontmatter: {},
      body: content,
      isValid: false,
      errors: ["Missing frontmatter: file must start with ---"],
    };
  }

  // Find closing delimiter
  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) {
    return {
      frontmatter: {},
      body: content,
      isValid: false,
      errors: ["Invalid frontmatter: missing closing ---"],
    };
  }

  // Extract frontmatter and body
  const frontmatterStr = content.slice(4, endIndex);
  const body = content.slice(endIndex + 4).trim();

  // Parse frontmatter
  const frontmatter = parseFrontmatter(frontmatterStr);

  // Validate required fields
  if (!frontmatter.name && !frontmatter.description) {
    errors.push("Warning: Consider adding name or description");
  }

  return {
    frontmatter,
    body,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract <input> block content from body
 */
export function extractInputBlock(body: string): string | null {
  const match = body.match(/<input>([\s\S]*?)<\/input>/);
  return match ? match[1].trim() : null;
}
