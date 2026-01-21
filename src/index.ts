#!/usr/bin/env node
/**
 * gen-md CLI
 *
 * Git-like MCP for predictive version control using .gen.md specs.
 */

import { Command } from "commander";
import chalk from "chalk";
import {
  initCommand,
  statusCommand,
  formatStatus,
  diffCommand,
  formatDiff,
  addCommand,
  commitCommand,
} from "./commands/index.js";
import { findGenMdRoot } from "./core/store.js";

const program = new Command();

program
  .name("gen-md")
  .description("Git-like MCP for predictive version control using .gen.md specs")
  .version("0.1.0");

// ============================================================================
// init command
// ============================================================================
program
  .command("init")
  .description("Initialize a gen-md repository")
  .argument("[path]", "Directory to initialize", ".")
  .action(async (path: string) => {
    try {
      await initCommand({ path });
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// status command
// ============================================================================
program
  .command("status")
  .description("Show status of .gen.md specs")
  .option("-p, --path <path>", "Path to check", ".")
  .option("--json", "Output as JSON")
  .action(async (options: { path: string; json: boolean }) => {
    try {
      const result = await statusCommand({ path: options.path });
      const root = await findGenMdRoot(options.path);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatStatus(result, root || process.cwd()));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// diff command
// ============================================================================
program
  .command("diff")
  .description("Show difference between current file and predicted content")
  .argument("<spec>", "Path to .gen.md spec")
  .option("--cached", "Show staged prediction (skip regeneration)")
  .option("--git", "Include git context in prediction")
  .option("--dry-run", "Show what would be generated without API call")
  .option("--json", "Output as JSON")
  .option("--no-color", "Disable colored output")
  .action(
    async (
      spec: string,
      options: {
        cached: boolean;
        git: boolean;
        dryRun: boolean;
        json: boolean;
        color: boolean;
      }
    ) => {
      try {
        const result = await diffCommand({
          spec,
          cached: options.cached,
          git: options.git,
          dryRun: options.dryRun,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatDiff(result, options.color));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// add command
// ============================================================================
program
  .command("add")
  .description("Create a .gen.md spec for a file or stage an existing spec")
  .argument("<file>", "File to create spec for, or spec to stage")
  .option("-d, --description <desc>", "Description for generated content")
  .option("-n, --name <name>", "Name for the generator")
  .option("-c, --context <files...>", "Context files to include")
  .option("-f, --force", "Force overwrite existing spec")
  .action(
    async (
      file: string,
      options: {
        description?: string;
        name?: string;
        context?: string[];
        force?: boolean;
      }
    ) => {
      try {
        await addCommand({
          file,
          description: options.description,
          name: options.name,
          context: options.context,
          force: options.force,
        });
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// commit command
// ============================================================================
program
  .command("commit")
  .description("Regenerate all staged specs and write output files")
  .option("-m, --message <msg>", "Commit message")
  .option("--git", "Include git context in predictions")
  .option("--dry-run", "Preview without writing files")
  .option("--json", "Output as JSON")
  .action(
    async (options: {
      message?: string;
      git: boolean;
      dryRun: boolean;
      json: boolean;
    }) => {
      try {
        const result = await commitCommand({
          message: options.message,
          git: options.git,
          dryRun: options.dryRun,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// Parse and run
// ============================================================================
program.parse();
