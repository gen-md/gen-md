/**
 * Status Command
 *
 * Shows the status of .gen.md specs - which need regeneration, which are up to date.
 * Like `git status`.
 */

import { readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import chalk from "chalk";
import { createParser } from "../core/parser.js";
import { createStore, findGenMdRoot } from "../core/store.js";
import type { SpecStatus, SpecStatusEntry, StatusResult } from "../types.js";

/**
 * Options for status command
 */
export interface StatusOptions {
  /** Path to check (default: current directory) */
  path?: string;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Execute status command
 */
export async function statusCommand(
  options: StatusOptions = {}
): Promise<StatusResult> {
  const targetPath = resolve(options.path || process.cwd());

  // Find gen-md root
  const root = await findGenMdRoot(targetPath);
  if (!root) {
    throw new Error(
      "Not a gen-md repository. Run 'gen-md init' to initialize."
    );
  }

  const store = createStore(root);
  const parser = createParser();

  // Get current branch
  const branch = await store.getHead();

  // Find all .gen.md files
  const specPaths = await store.findAllSpecs();

  // Get staged specs
  const stagedSpecs = await store.getStagedSpecs();
  const stagedSet = new Set(stagedSpecs.map((s) => s.specPath));

  // Build status entries
  const specs: SpecStatusEntry[] = [];

  for (const specPath of specPaths) {
    try {
      const file = await parser.parse(specPath);
      const resolvedFile = parser.resolveRelativePaths(file);

      const outputPath = resolvedFile.frontmatter.output;
      if (!outputPath) {
        // Spec without output (cascade-only config)
        continue;
      }

      const specStat = await stat(specPath);
      let outputStat;
      let status: SpecStatus;

      try {
        outputStat = await stat(outputPath);
      } catch {
        // Output doesn't exist
        outputStat = null;
      }

      // Determine status
      if (stagedSet.has(specPath)) {
        status = "staged";
      } else if (!outputStat) {
        status = "missing";
      } else if (specStat.mtime > outputStat.mtime) {
        status = "modified";
      } else {
        status = "up-to-date";
      }

      specs.push({
        specPath,
        outputPath,
        status,
        specModified: specStat.mtime,
        outputModified: outputStat?.mtime,
      });
    } catch {
      // Skip specs that can't be parsed
    }
  }

  // Count by status
  const stagedCount = specs.filter((s) => s.status === "staged").length;
  const modifiedCount = specs.filter((s) => s.status === "modified").length;
  const untrackedCount = specs.filter((s) => s.status === "missing").length;

  return {
    branch,
    specs,
    stagedCount,
    modifiedCount,
    untrackedCount,
  };
}

/**
 * Format status result for display
 */
export function formatStatus(result: StatusResult, root: string): string {
  const lines: string[] = [];

  lines.push(chalk.bold(`On branch: ${result.branch}`));
  lines.push("");

  // Staged specs
  const staged = result.specs.filter((s) => s.status === "staged");
  if (staged.length > 0) {
    lines.push(chalk.green("Changes to be committed:"));
    lines.push(chalk.gray('  (use "gen-md unstage <spec>" to unstage)'));
    lines.push("");
    for (const spec of staged) {
      const relSpec = relative(root, spec.specPath);
      const relOutput = relative(root, spec.outputPath);
      lines.push(chalk.green(`        staged:   ${relSpec} -> ${relOutput}`));
    }
    lines.push("");
  }

  // Modified specs
  const modified = result.specs.filter((s) => s.status === "modified");
  if (modified.length > 0) {
    lines.push(chalk.yellow("Changes not staged for commit:"));
    lines.push(chalk.gray('  (use "gen-md add <spec>" to stage)'));
    lines.push(chalk.gray('  (use "gen-md diff <spec>" to see what changed)'));
    lines.push("");
    for (const spec of modified) {
      const relSpec = relative(root, spec.specPath);
      const relOutput = relative(root, spec.outputPath);
      lines.push(
        chalk.yellow(`        modified: ${relSpec} -> ${relOutput}`)
      );
    }
    lines.push("");
  }

  // Missing outputs
  const missing = result.specs.filter((s) => s.status === "missing");
  if (missing.length > 0) {
    lines.push(chalk.red("Specs with missing outputs:"));
    lines.push(chalk.gray('  (use "gen-md add <spec>" to stage for generation)'));
    lines.push("");
    for (const spec of missing) {
      const relSpec = relative(root, spec.specPath);
      const relOutput = relative(root, spec.outputPath);
      lines.push(chalk.red(`        new:      ${relSpec} -> ${relOutput}`));
    }
    lines.push("");
  }

  // Up to date
  const upToDate = result.specs.filter((s) => s.status === "up-to-date");
  if (upToDate.length > 0 && staged.length === 0 && modified.length === 0 && missing.length === 0) {
    lines.push(chalk.green("All specs are up to date."));
  } else if (staged.length === 0 && modified.length === 0 && missing.length === 0) {
    lines.push(chalk.gray("Nothing to commit, working tree clean"));
  }

  return lines.join("\n");
}
