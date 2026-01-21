/**
 * Show Command
 *
 * Show a specific generation by hash.
 */

import chalk from "chalk";
import { GenMdStore, findGenMdRoot } from "../core/store.js";
import type { LogEntry } from "../types.js";

/**
 * Show command options
 */
export interface ShowCommandOptions {
  hash: string;
  path?: string;
}

/**
 * Show command result
 */
export interface ShowCommandResult {
  entry: LogEntry;
  content: string;
}

/**
 * Execute the show command
 */
export async function showCommand(options: ShowCommandOptions): Promise<ShowCommandResult> {
  const startPath = options.path || process.cwd();
  const root = await findGenMdRoot(startPath);

  if (!root) {
    throw new Error("Not a gitgen repository (or any parent up to root)");
  }

  const store = new GenMdStore(root);

  // Find the log entry by hash prefix
  const entries = await store.getLog();
  const matching = entries.filter((e: LogEntry) =>
    e.hash.startsWith(options.hash) || e.contentHash.startsWith(options.hash)
  );

  if (matching.length === 0) {
    throw new Error(`No generation found with hash: ${options.hash}`);
  }

  if (matching.length > 1) {
    throw new Error(
      `Ambiguous hash "${options.hash}" matches ${matching.length} generations. Use a longer prefix.`
    );
  }

  const entry = matching[0];

  // Try to read the content from objects
  let content: string;
  try {
    content = await store.readObject(entry.contentHash);
  } catch {
    throw new Error(`Content for generation ${entry.hash.slice(0, 7)} not found in object store`);
  }

  return {
    entry,
    content,
  };
}

/**
 * Format show output
 */
export function formatShow(result: ShowCommandResult): string {
  const { entry, content } = result;
  const hash = entry.hash.slice(0, 7);
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleString();

  const header = [
    chalk.yellow(`commit ${hash}`),
    `Model: ${entry.model}`,
    `Date: ${dateStr}`,
    `Tokens: ${entry.tokens.input} in / ${entry.tokens.output} out`,
    "",
    `    ${entry.message}`,
    "",
    chalk.dim("─".repeat(60)),
    "",
  ].join("\n");

  return header + content;
}
