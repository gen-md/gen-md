/**
 * Code Review Extension
 *
 * Sample extension that adds code review guidelines to generated content.
 * Demonstrates how to extend gen-md with custom prompt sections and hooks.
 */

import type {
  Extension,
  ExtensionRegistry,
  PromptSection,
} from "../../src/core/extensions.js";
import type { PredictionContext } from "../../src/types.js";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Code review guidelines prompt section
 */
const codeReviewSection: PromptSection = {
  name: "code-review-guidelines",
  priority: 50, // Between context (100) and instructions (0)

  async build(_context: PredictionContext): Promise<string> {
    try {
      const guidelines = await readFile(
        join(__dirname, "guidelines.md"),
        "utf-8"
      );
      return guidelines;
    } catch {
      // Fall back to inline guidelines
      return `
# Code Review Guidelines

When generating code, follow these principles:

1. **Readability** - Code should be self-documenting
2. **Simplicity** - Avoid over-engineering
3. **Consistency** - Follow existing patterns in the codebase
4. **Security** - Never introduce vulnerabilities
5. **Performance** - Consider algorithmic complexity

## Checklist
- [ ] Names are descriptive and follow conventions
- [ ] Functions are small and focused
- [ ] Error handling is appropriate
- [ ] No hardcoded values that should be configurable
- [ ] Comments explain "why", not "what"
`;
    }
  },

  shouldInclude(context: PredictionContext): boolean {
    // Only include for code files
    const output = context.config.frontmatter.output;
    if (!output) return false;

    const codeExtensions = [
      ".ts",
      ".js",
      ".tsx",
      ".jsx",
      ".py",
      ".go",
      ".rs",
      ".java",
      ".c",
      ".cpp",
      ".h",
    ];
    return codeExtensions.some((ext) => output.endsWith(ext));
  },
};

/**
 * Code Review Extension
 */
export const codeReviewExtension: Extension = {
  name: "code-review",
  version: "1.0.0",
  description: "Adds code review guidelines to generated code",

  activate(registry: ExtensionRegistry): void {
    // Register the code review section
    registry.registerSection(codeReviewSection);

    // Add a post-predict hook to validate generated code
    registry.onPostPredict(async (result, context) => {
      const output = context.config.frontmatter.output;
      if (!output) return result;

      // Simple validation: check for common anti-patterns
      const antiPatterns = [
        { pattern: /console\.log\(/g, warning: "Contains console.log" },
        { pattern: /TODO:/gi, warning: "Contains TODO comment" },
        { pattern: /FIXME:/gi, warning: "Contains FIXME comment" },
        { pattern: /password\s*=\s*["'][^"']+["']/gi, warning: "Possible hardcoded password" },
      ];

      const warnings: string[] = [];
      for (const { pattern, warning } of antiPatterns) {
        if (pattern.test(result.content)) {
          warnings.push(warning);
        }
      }

      if (warnings.length > 0) {
        // Add warnings as comments at the top of the file
        const warningBlock = warnings
          .map((w) => `// WARNING: ${w}`)
          .join("\n");
        return {
          ...result,
          content: `${warningBlock}\n\n${result.content}`,
        };
      }

      return result;
    });
  },

  deactivate(): void {
    // Cleanup if needed
  },
};

export default codeReviewExtension;
