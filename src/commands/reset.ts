/**
 * Reset Command
 *
 * Reset a file to a previous generation.
 */

import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { GenMdStore, findGenMdRoot } from "../core/store.js";
import type { LogEntry } from "../types.js";

/**
 * Reset command options
 */
export interface ResetCommandOptions {
  hash: string;
  hard?: boolean;
  path?: string;
}

/**
 * Reset command result
 */
export interface ResetCommandResult {
  entry: LogEntry;
  outputPath: string;
  written: boolean;
}

/**
 * Execute the reset command
 */
export async function resetCommand(options: ResetCommandOptions): Promise<ResetCommandResult> {
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

  // Read the content from objects
  let content: string;
  try {
    content = await store.readObject(entry.contentHash);
  } catch {
    throw new Error(`Content for generation ${entry.hash.slice(0, 7)} not found in object store`);
  }

  let written = false;

  if (options.hard) {
    // Write the content to the output file
    await writeFile(entry.outputPath, content, "utf-8");
    written = true;

    // Log the reset
    await store.appendLog({
      hash: entry.hash,
      message: `Reset to ${entry.hash.slice(0, 7)}`,
      specPath: entry.specPath,
      outputPath: entry.outputPath,
      contentHash: entry.contentHash,
      timestamp: new Date(),
      model: entry.model,
      tokens: { input: 0, output: 0 },
    });
  }

  return {
    entry,
    outputPath: entry.outputPath,
    written,
  };
}

/**
 * Format reset output
 */
export function formatReset(result: ResetCommandResult): string {
  const hash = result.entry.hash.slice(0, 7);

  if (result.written) {
    return chalk.green(`Reset ${result.outputPath} to generation ${hash}`);
  }

  return [
    chalk.yellow(`Would reset ${result.outputPath} to generation ${hash}`),
    chalk.dim("Use --hard to actually reset the file"),
  ].join("\n");
}
