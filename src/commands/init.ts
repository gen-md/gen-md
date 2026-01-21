/**
 * Init Command
 *
 * Initializes a gitgen repository by creating the .gitgen directory.
 * Like `git init`.
 */

import { resolve, relative } from "node:path";
import chalk from "chalk";
import { createStore } from "../core/store.js";

/**
 * Options for init command
 */
export interface InitOptions {
  /** Directory to initialize (default: current directory) */
  path?: string;
}

/**
 * Result of init command
 */
export interface InitResult {
  /** Path to the initialized repository */
  path: string;
  /** Path to the .gitgen directory */
  genMdPath: string;
  /** Whether this was a new initialization or reinit */
  isNew: boolean;
}

/**
 * Execute init command
 */
export async function initCommand(
  options: InitOptions = {}
): Promise<InitResult> {
  const targetPath = resolve(options.path || process.cwd());
  const store = createStore(targetPath);

  const wasInitialized = await store.isInitialized();

  // Initialize the store
  await store.init();

  const result: InitResult = {
    path: targetPath,
    genMdPath: store.path,
    isNew: !wasInitialized,
  };

  if (wasInitialized) {
    console.error(
      chalk.yellow(`Reinitialized existing gitgen repository in ${store.path}`)
    );
  } else {
    console.error(
      chalk.green(`Initialized empty gitgen repository in ${store.path}`)
    );
  }

  return result;
}

/**
 * Format init result for display
 */
export function formatInitResult(result: InitResult): string {
  if (result.isNew) {
    return chalk.green(`Initialized empty gitgen repository in ${result.genMdPath}`);
  }
  return chalk.yellow(`Reinitialized existing gitgen repository in ${result.genMdPath}`);
}
