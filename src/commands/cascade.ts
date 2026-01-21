/**
 * Cascade Command
 *
 * Shows the inheritance chain for a .gitgen.md spec.
 * Helps debug cascading configuration issues.
 */

import { resolve, relative, dirname } from "node:path";
import chalk from "chalk";
import { createResolver } from "../core/resolver.js";
import { findGenMdRoot } from "../core/store.js";
import type { GenMdFile, ResolvedGenMdConfig } from "../types.js";

/**
 * Options for cascade command
 */
export interface CascadeOptions {
  /** Path to the .gitgen.md spec */
  spec: string;
  /** Show full content of each file */
  full?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Result of cascade command
 */
export interface CascadeResult {
  /** The cascade chain from root to leaf */
  chain: Array<{
    path: string;
    relativePath: string;
    frontmatter: Record<string, unknown>;
    bodyPreview: string;
    examplesCount: number;
  }>;
  /** The resolved/merged configuration */
  resolved: {
    frontmatter: Record<string, unknown>;
    body: string;
    examplesCount: number;
    contextFiles: string[];
    skillsFiles: string[];
  };
}

/**
 * Execute cascade command
 */
export async function cascadeCommand(options: CascadeOptions): Promise<CascadeResult> {
  const specPath = resolve(options.spec);

  // Find gitgen root
  const root = await findGenMdRoot(dirname(specPath));
  if (!root) {
    throw new Error(
      "Not a gitgen repository. Run 'gitgen init' to initialize."
    );
  }

  const resolver = createResolver();
  const resolved = await resolver.resolve(specPath);

  // Build chain info
  const chain = resolved.chain.map((file) => ({
    path: file.filePath,
    relativePath: relative(root, file.filePath),
    frontmatter: file.frontmatter as Record<string, unknown>,
    bodyPreview: options.full
      ? file.body
      : file.body.slice(0, 200) + (file.body.length > 200 ? "..." : ""),
    examplesCount: file.examples.length,
  }));

  // Build resolved info
  const resolvedInfo = {
    frontmatter: resolved.frontmatter as Record<string, unknown>,
    body: options.full
      ? resolved.body
      : resolved.body.slice(0, 500) + (resolved.body.length > 500 ? "..." : ""),
    examplesCount: resolved.examples.length,
    contextFiles: resolved.frontmatter.context || [],
    skillsFiles: resolved.frontmatter.skills || [],
  };

  return {
    chain,
    resolved: resolvedInfo,
  };
}

/**
 * Format cascade result for display
 */
export function formatCascade(result: CascadeResult, colored = true): string {
  const lines: string[] = [];

  // Header
  lines.push(chalk.bold.cyan("Cascade Chain\n"));

  // Show chain
  result.chain.forEach((file, index) => {
    const isLast = index === result.chain.length - 1;
    const prefix = isLast ? "└──" : "├──";
    const indent = isLast ? "   " : "│  ";

    lines.push(
      chalk.gray(prefix) + " " +
      (isLast ? chalk.green.bold(file.relativePath) : chalk.yellow(file.relativePath))
    );

    // Show frontmatter keys
    const keys = Object.keys(file.frontmatter).filter(k => file.frontmatter[k] !== undefined);
    if (keys.length > 0) {
      lines.push(chalk.gray(indent + "  frontmatter: ") + keys.join(", "));
    }

    // Show body preview
    if (file.bodyPreview) {
      const preview = file.bodyPreview.split("\n")[0];
      lines.push(chalk.gray(indent + "  body: ") + chalk.dim(preview.slice(0, 60) + (preview.length > 60 ? "..." : "")));
    }

    // Show examples count
    if (file.examplesCount > 0) {
      lines.push(chalk.gray(indent + "  examples: ") + file.examplesCount);
    }

    lines.push("");
  });

  // Show resolved config
  lines.push(chalk.bold.cyan("Resolved Configuration\n"));

  // Frontmatter
  const fm = result.resolved.frontmatter;
  if (fm.name) lines.push(chalk.gray("  name: ") + fm.name);
  if (fm.description) lines.push(chalk.gray("  description: ") + fm.description);
  if (fm.output) lines.push(chalk.gray("  output: ") + chalk.green(fm.output as string));

  // Context files
  if (result.resolved.contextFiles.length > 0) {
    lines.push(chalk.gray("  context:"));
    result.resolved.contextFiles.forEach(f => {
      lines.push(chalk.gray("    - ") + f);
    });
  }

  // Skills
  if (result.resolved.skillsFiles.length > 0) {
    lines.push(chalk.gray("  skills:"));
    result.resolved.skillsFiles.forEach(f => {
      lines.push(chalk.gray("    - ") + f);
    });
  }

  // Examples
  if (result.resolved.examplesCount > 0) {
    lines.push(chalk.gray("  examples: ") + result.resolved.examplesCount);
  }

  // Body summary
  if (result.resolved.body) {
    const wordCount = result.resolved.body.split(/\s+/).length;
    lines.push(chalk.gray("  body: ") + `${wordCount} words`);
  }

  return lines.join("\n");
}
