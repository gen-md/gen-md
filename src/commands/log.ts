/**
 * Log Command
 *
 * Show generation history for a spec.
 */

import chalk from "chalk";
import { resolve, dirname, relative } from "node:path";
import { GenMdStore, findGenMdRoot } from "../core/store.js";
import type { LogEntry } from "../types.js";

/**
 * Log command options
 */
export interface LogCommandOptions {
  spec?: string;
  limit?: number;
  path?: string;
}

/**
 * Log command result
 */
export interface LogCommandResult {
  entries: LogEntry[];
  specPath?: string;
}

/**
 * Execute the log command
 */
export async function logCommand(options: LogCommandOptions): Promise<LogCommandResult> {
  const startPath = options.path || process.cwd();
  const root = await findGenMdRoot(startPath);

  if (!root) {
    throw new Error("Not a gitgen repository (or any parent up to root)");
  }

  const store = new GenMdStore(root);
  let entries = await store.getLog();

  // Filter by spec if provided
  if (options.spec) {
    const specPath = resolve(options.spec);
    entries = entries.filter((e: LogEntry) => e.specPath === specPath);
  }

  // Sort by timestamp descending (newest first)
  entries.sort((a: LogEntry, b: LogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit results
  if (options.limit) {
    entries = entries.slice(0, options.limit);
  }

  return {
    entries,
    specPath: options.spec ? resolve(options.spec) : undefined,
  };
}

/**
 * Format log for display (git log style)
 */
export function formatLog(result: LogCommandResult, root: string): string {
  if (result.entries.length === 0) {
    return chalk.dim("No generation history");
  }

  const lines: string[] = [];

  for (const entry of result.entries) {
    const hash = entry.hash.slice(0, 7);
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleString();
    const tokens = `${entry.tokens.input.toLocaleString()} in / ${entry.tokens.output.toLocaleString()} out`;
    const specRel = relative(root, entry.specPath);
    const outputRel = relative(root, entry.outputPath);

    lines.push(chalk.yellow(`commit ${hash}`));
    lines.push(`Model: ${entry.model}`);
    lines.push(`Date: ${dateStr}`);
    lines.push(`Tokens: ${tokens}`);
    lines.push(`Spec: ${specRel} -> ${outputRel}`);
    lines.push("");
    lines.push(`    ${entry.message}`);
    lines.push("");
  }

  return lines.join("\n");
}
