/**
 * Add Command
 *
 * Creates a .gitgen.md spec for an existing file OR stages a spec for commit.
 * Like `git add`.
 */

import { readFile, writeFile, stat } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import chalk from "chalk";
import { createParser } from "../core/parser.js";
import { createStore, findGenMdRoot } from "../core/store.js";
import type { AddResult } from "../types.js";

/**
 * Options for add command
 */
export interface AddOptions {
  /** File to create spec for, or spec to stage */
  file: string;
  /** Description for the generated content (when creating new spec) */
  description?: string;
  /** Name for the generator (when creating new spec) */
  name?: string;
  /** Context files to include (when creating new spec) */
  context?: string[];
  /** Force overwrite existing spec */
  force?: boolean;
}

/**
 * Execute add command
 */
export async function addCommand(options: AddOptions): Promise<AddResult> {
  const filePath = resolve(options.file);

  // Find gitgen root
  const root = await findGenMdRoot(dirname(filePath));
  if (!root) {
    throw new Error(
      "Not a gitgen repository. Run 'gitgen init' to initialize."
    );
  }

  const store = createStore(root);
  const parser = createParser();

  // Check if the file is a .gitgen.md spec or a regular file
  if (filePath.endsWith(".gitgen.md")) {
    // Stage the spec for commit
    return stageSpec(filePath, store, parser, root);
  } else {
    // Create a new spec for the file
    return createSpec(filePath, options, store, root);
  }
}

/**
 * Stage an existing .gitgen.md spec for commit
 */
async function stageSpec(
  specPath: string,
  store: ReturnType<typeof createStore>,
  parser: ReturnType<typeof createParser>,
  root: string
): Promise<AddResult> {
  // Parse the spec
  const file = await parser.parse(specPath);
  const resolved = parser.resolveRelativePaths(file);

  const outputPath = resolved.frontmatter.output;
  if (!outputPath) {
    throw new Error("Spec has no output field - cannot stage");
  }

  // Read spec content for hashing
  const specContent = await readFile(specPath, "utf-8");

  // Stage the spec
  await store.stageSpec(specPath, outputPath, specContent);

  console.error(
    chalk.green(`Staged: ${relative(root, specPath)} -> ${relative(root, outputPath)}`)
  );

  return {
    specPath,
    created: false,
    staged: true,
  };
}

/**
 * Create a new .gitgen.md spec for a file
 */
async function createSpec(
  filePath: string,
  options: AddOptions,
  store: ReturnType<typeof createStore>,
  root: string
): Promise<AddResult> {
  // Generate spec path
  const ext = extname(filePath);
  const base = basename(filePath, ext);
  const dir = dirname(filePath);
  const specPath = resolve(dir, `${base}.gitgen.md`);

  // Check if spec already exists
  try {
    await stat(specPath);
    if (!options.force) {
      throw new Error(
        `Spec already exists: ${relative(root, specPath)}. Use --force to overwrite.`
      );
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      throw e;
    }
  }

  // Read existing file content for context
  let existingContent = "";
  try {
    existingContent = await readFile(filePath, "utf-8");
  } catch {
    // File doesn't exist yet - that's OK
  }

  // Generate spec content
  const name = options.name || inferName(filePath);
  const description = options.description || inferDescription(filePath, existingContent);
  const outputName = basename(filePath);
  const contextPaths = options.context || [];

  const specContent = generateSpecContent({
    name,
    description,
    output: outputName,
    context: contextPaths,
    existingContent,
  });

  // Write the spec
  await writeFile(specPath, specContent, "utf-8");

  console.error(chalk.green(`Created: ${relative(root, specPath)}`));

  // Optionally stage it
  const specFileContent = await readFile(specPath, "utf-8");
  await store.stageSpec(specPath, filePath, specFileContent);

  console.error(
    chalk.green(`Staged: ${relative(root, specPath)} -> ${outputName}`)
  );

  return {
    specPath,
    created: true,
    staged: true,
  };
}

/**
 * Infer a name from file path
 */
function inferName(filePath: string): string {
  const base = basename(filePath, extname(filePath));
  // Convert to title case
  return base
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Infer description from file path and content
 */
function inferDescription(filePath: string, _content: string): string {
  const ext = extname(filePath);
  const base = basename(filePath, ext);

  // Common file types
  const fileTypes: Record<string, string> = {
    ".md": "documentation",
    ".ts": "TypeScript code",
    ".tsx": "React TypeScript component",
    ".js": "JavaScript code",
    ".jsx": "React JavaScript component",
    ".py": "Python code",
    ".go": "Go code",
    ".rs": "Rust code",
    ".json": "JSON configuration",
    ".yaml": "YAML configuration",
    ".yml": "YAML configuration",
    ".css": "CSS styles",
    ".scss": "SCSS styles",
    ".html": "HTML markup",
  };

  const fileType = fileTypes[ext] || "file";

  if (base.toLowerCase() === "readme") {
    return "Generate README documentation for the project";
  }

  if (base.toLowerCase().includes("test")) {
    return `Generate tests for ${base.replace(/\.?test\.?/i, "")}`;
  }

  return `Generate ${fileType} for ${base}`;
}

/**
 * Generate spec file content
 */
function generateSpecContent(options: {
  name: string;
  description: string;
  output: string;
  context: string[];
  existingContent: string;
}): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push(`name: "${options.name}"`);
  lines.push(`description: "${options.description}"`);

  if (options.context.length > 0) {
    lines.push("context:");
    for (const ctx of options.context) {
      lines.push(`  - "${ctx}"`);
    }
  }

  lines.push(`output: "${options.output}"`);
  lines.push("---");
  lines.push("");

  // Body
  lines.push(options.description);
  lines.push("");

  // Add placeholder instructions
  lines.push("## Requirements");
  lines.push("");
  lines.push("- Follow existing code style and conventions");
  lines.push("- Include appropriate comments and documentation");
  lines.push("- Ensure code is well-tested (if applicable)");
  lines.push("");

  // Add example if there's existing content
  if (options.existingContent.trim()) {
    lines.push("## Current Content");
    lines.push("");
    lines.push("The file currently contains:");
    lines.push("");
    lines.push("```");
    // Truncate long content
    const truncated = options.existingContent.slice(0, 1000);
    lines.push(truncated);
    if (options.existingContent.length > 1000) {
      lines.push("... (truncated)");
    }
    lines.push("```");
  }

  return lines.join("\n");
}

/**
 * Format add result for display
 */
export function formatAddResult(result: AddResult, root: string): string {
  const relPath = relative(root, result.specPath);

  if (result.created) {
    return chalk.green(`Created and staged: ${relPath}`);
  }

  return chalk.green(`Staged: ${relPath}`);
}
