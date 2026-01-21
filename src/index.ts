#!/usr/bin/env node
/**
 * gitgen CLI
 *
 * Git-like MCP for predictive version control using .gitgen.md specs.
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
  watchCommand,
  cascadeCommand,
  formatCascade,
  validateCommand,
  formatValidate,
} from "./commands/index.js";
import { findGenMdRoot } from "./core/store.js";

const program = new Command();

program
  .name("gitgen")
  .description("Git-like MCP for predictive version control using .gitgen.md specs")
  .version("0.1.0");

// ============================================================================
// init command
// ============================================================================
program
  .command("init")
  .description("Initialize a gitgen repository")
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
  .description("Show status of .gitgen.md specs")
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
  .argument("<spec>", "Path to .gitgen.md spec")
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
  .description("Create a .gitgen.md spec for a file or stage an existing spec")
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
// watch command
// ============================================================================
program
  .command("watch")
  .description("Watch .gitgen.md files and auto-regenerate on change")
  .option("-p, --path <path>", "Path to watch", ".")
  .option("--git", "Include git context in predictions")
  .option("--debounce <ms>", "Debounce time in ms", "500")
  .option("--initial", "Run initial generation for all modified specs")
  .action(
    async (options: {
      path: string;
      git: boolean;
      debounce: string;
      initial: boolean;
    }) => {
      try {
        await watchCommand({
          path: options.path,
          git: options.git,
          debounce: parseInt(options.debounce, 10),
          initial: options.initial,
        });
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// cascade command
// ============================================================================
program
  .command("cascade")
  .description("Show the cascade chain for a .gitgen.md spec")
  .argument("<spec>", "Path to .gitgen.md spec")
  .option("--full", "Show full content of each file")
  .option("--json", "Output as JSON")
  .action(
    async (
      spec: string,
      options: {
        full: boolean;
        json: boolean;
      }
    ) => {
      try {
        const result = await cascadeCommand({
          spec,
          full: options.full,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatCascade(result));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// validate command
// ============================================================================
program
  .command("validate")
  .description("Validate .gitgen.md specs without making API calls")
  .argument("[path]", "Path to validate (spec or directory)", ".")
  .option("--json", "Output as JSON")
  .action(
    async (
      path: string,
      options: {
        json: boolean;
      }
    ) => {
      try {
        const result = await validateCommand({ path });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatValidate(result));
        }

        // Exit with error code if there are errors
        if (result.errors > 0) {
          process.exit(1);
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
