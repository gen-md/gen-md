/**
 * Terminal Chat Mode for Refinement
 *
 * Interactive terminal-based refinement session.
 */

import * as readline from "node:readline";
import chalk from "chalk";
import type { RefineSession, PredictionContext } from "../types.js";
import {
  createSession,
  generateInitial,
  refineWithFeedback,
  goBack,
  getCurrentVersion,
  getVersion,
  getTotalTokens,
  getSessionSummary,
} from "./session.js";

/**
 * Terminal chat commands
 */
const COMMANDS: Record<string, string> = {
  "/accept": "Accept current version and save",
  "/reject": "Discard and exit",
  "/history": "Show refinement history",
  "/back": "Go to previous version",
  "/diff": "Show diff from original",
  "/version": "Show current version info",
  "/model": "Switch model (e.g., /model gpt-4o)",
  "/provider": "Switch provider (e.g., /provider openai)",
  "/help": "Show this help",
  "/quit": "Same as /reject",
};

/**
 * Result of terminal refinement session
 */
export interface TerminalRefineResult {
  accepted: boolean;
  content: string | null;
  session: RefineSession;
}

/**
 * Options for terminal refinement
 */
export interface TerminalRefineOptions {
  provider?: string;
  model?: string;
  gitContext?: PredictionContext["gitContext"];
}

/**
 * Run interactive terminal refinement session
 */
export async function runTerminalRefine(
  specPath: string,
  options: TerminalRefineOptions = {}
): Promise<TerminalRefineResult> {
  const session = createSession(specPath);
  let currentProvider = options.provider;
  let currentModel = options.model;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    // Generate initial content
    console.log(chalk.cyan("🤖 Generating initial version..."));
    console.log();

    const initial = await generateInitial(session, {
      provider: currentProvider,
      model: currentModel,
      gitContext: options.gitContext,
    });

    displayPreview(initial.content);
    displayVersionInfo(session, initial);

    // Main refinement loop
    while (true) {
      const input = await prompt(chalk.green("\nYou: "));
      const trimmed = input.trim();

      if (!trimmed) {
        continue;
      }

      // Handle commands
      if (trimmed.startsWith("/")) {
        const [cmd, ...args] = trimmed.split(" ");
        const command = cmd.toLowerCase();

        switch (command) {
          case "/accept":
            console.log();
            console.log(chalk.green("✓ Accepted!"));
            console.log(chalk.dim(getSessionSummary(session)));
            rl.close();
            return {
              accepted: true,
              content: session.currentContent,
              session,
            };

          case "/reject":
          case "/quit":
            console.log();
            console.log(chalk.yellow("✗ Discarded"));
            rl.close();
            return {
              accepted: false,
              content: null,
              session,
            };

          case "/history":
            displayHistory(session);
            break;

          case "/back":
            const previous = goBack(session);
            if (previous) {
              console.log(chalk.cyan(`\n⬅ Reverted to version ${getCurrentVersion(session)}`));
              displayPreview(previous.content);
            } else {
              console.log(chalk.yellow("\nAlready at first version"));
            }
            break;

          case "/version":
            const current = getVersion(session, getCurrentVersion(session));
            if (current) {
              displayVersionInfo(session, current);
            }
            break;

          case "/diff":
            // TODO: Implement diff display
            console.log(chalk.dim("\nDiff display coming soon..."));
            break;

          case "/model":
            if (args.length > 0) {
              currentModel = args.join(" ");
              console.log(chalk.cyan(`\nModel set to: ${currentModel}`));
            } else {
              console.log(chalk.yellow("\nUsage: /model <model-name>"));
            }
            break;

          case "/provider":
            if (args.length > 0) {
              currentProvider = args[0];
              console.log(chalk.cyan(`\nProvider set to: ${currentProvider}`));
            } else {
              console.log(chalk.yellow("\nUsage: /provider <provider-name>"));
            }
            break;

          case "/help":
            displayHelp();
            break;

          default:
            console.log(chalk.yellow(`\nUnknown command: ${cmd}`));
            console.log(chalk.dim("Type /help for available commands"));
        }

        continue;
      }

      // Regular feedback - refine the content
      console.log(chalk.cyan("\n🤖 Refining..."));

      try {
        const entry = await refineWithFeedback(session, trimmed, {
          provider: currentProvider,
          model: currentModel,
          gitContext: options.gitContext,
        });

        console.log();
        displayPreview(entry.content);
        displayVersionInfo(session, entry);
      } catch (error) {
        console.log(chalk.red(`\nError: ${(error as Error).message}`));
      }
    }
  } finally {
    rl.close();
  }
}

/**
 * Display content preview
 */
function displayPreview(content: string): void {
  const lines = content.split("\n");
  const maxLines = 30;
  const truncated = lines.length > maxLines;

  console.log(chalk.dim("─".repeat(60)));
  console.log(truncated ? lines.slice(0, maxLines).join("\n") : content);
  if (truncated) {
    console.log(chalk.dim(`\n... (${lines.length - maxLines} more lines)`));
  }
  console.log(chalk.dim("─".repeat(60)));
}

/**
 * Display version info
 */
function displayVersionInfo(session: RefineSession, entry: { model: string; tokens: { input: number; output: number }; feedback?: string }): void {
  const version = getCurrentVersion(session);
  const tokens = entry.tokens.input + entry.tokens.output;

  console.log(
    chalk.dim(`v${version} | ${entry.model} | ${tokens} tokens`) +
      (entry.feedback ? chalk.dim(` | "${entry.feedback.slice(0, 30)}..."`) : "")
  );
}

/**
 * Display refinement history
 */
function displayHistory(session: RefineSession): void {
  console.log(chalk.cyan("\n📜 Refinement History"));
  console.log();

  session.history.forEach((entry, index) => {
    const isCurrent = index === session.history.length - 1;
    const marker = isCurrent ? chalk.green("→") : " ";
    const version = index + 1;

    console.log(
      `${marker} v${version} [${entry.hash}] ${entry.model}` +
        (entry.feedback ? chalk.dim(` - "${entry.feedback.slice(0, 40)}..."`) : chalk.dim(" - initial"))
    );
  });

  const tokens = getTotalTokens(session);
  console.log();
  console.log(chalk.dim(`Total: ${tokens.input + tokens.output} tokens`));
}

/**
 * Display help
 */
function displayHelp(): void {
  console.log(chalk.cyan("\n📖 Commands"));
  console.log();

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${chalk.green(cmd.padEnd(12))} ${desc}`);
  });

  console.log();
  console.log(chalk.dim("Type anything else to refine the current content"));
}
