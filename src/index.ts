#!/usr/bin/env node
/**
 * gitgen CLI
 *
 * Git for AI-generated content. Version control for what SHOULD BE.
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
  refineCommand,
  configCommand,
  providerCommand,
  formatConfig,
  formatProviders,
  logCommand,
  formatLog,
  showCommand,
  formatShow,
  resetCommand,
  formatReset,
} from "./commands/index.js";
import { findGenMdRoot } from "./core/store.js";

const program = new Command();

program
  .name("gitgen")
  .description("Git for AI-generated content. Version control for what SHOULD BE.")
  .version("0.2.0");

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
  .option("--provider <name>", "LLM provider to use")
  .option("--model <name>", "Model to use")
  .action(
    async (
      spec: string,
      options: {
        cached: boolean;
        git: boolean;
        dryRun: boolean;
        json: boolean;
        color: boolean;
        provider?: string;
        model?: string;
      }
    ) => {
      try {
        const result = await diffCommand({
          spec,
          cached: options.cached,
          git: options.git,
          dryRun: options.dryRun,
          provider: options.provider,
          model: options.model,
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
  .option("--provider <name>", "LLM provider to use")
  .option("--model <name>", "Model to use")
  .action(
    async (options: {
      message?: string;
      git: boolean;
      dryRun: boolean;
      json: boolean;
      provider?: string;
      model?: string;
    }) => {
      try {
        const result = await commitCommand({
          message: options.message,
          git: options.git,
          dryRun: options.dryRun,
          provider: options.provider,
          model: options.model,
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
// refine command (NEW)
// ============================================================================
program
  .command("refine")
  .description("Interactive refinement session for a spec")
  .argument("<spec>", "Path to .gitgen.md spec")
  .option("--git", "Include git context in predictions")
  .option("--provider <name>", "LLM provider to use")
  .option("--model <name>", "Model to use")
  .action(
    async (
      spec: string,
      options: {
        git?: boolean;
        provider?: string;
        model?: string;
      }
    ) => {
      try {
        await refineCommand({
          spec,
          git: options.git,
          provider: options.provider,
          model: options.model,
        });
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
// log command (NEW)
// ============================================================================
program
  .command("log")
  .description("Show generation history")
  .argument("[spec]", "Path to .gitgen.md spec (optional)")
  .option("-n, --limit <n>", "Limit number of entries")
  .option("--json", "Output as JSON")
  .action(
    async (
      spec: string | undefined,
      options: {
        limit?: string;
        json: boolean;
      }
    ) => {
      try {
        const result = await logCommand({
          spec,
          limit: options.limit ? parseInt(options.limit, 10) : undefined,
        });
        const root = await findGenMdRoot(process.cwd());

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatLog(result, root || process.cwd()));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// show command (NEW)
// ============================================================================
program
  .command("show")
  .description("Show a specific generation by hash")
  .argument("<hash>", "Generation hash (or prefix)")
  .option("--json", "Output as JSON")
  .action(
    async (
      hash: string,
      options: {
        json: boolean;
      }
    ) => {
      try {
        const result = await showCommand({ hash });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatShow(result));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// reset command (NEW)
// ============================================================================
program
  .command("reset")
  .description("Reset a file to a previous generation")
  .argument("<hash>", "Generation hash (or prefix)")
  .option("--hard", "Actually reset the file (otherwise preview)")
  .action(
    async (
      hash: string,
      options: {
        hard: boolean;
      }
    ) => {
      try {
        const result = await resetCommand({
          hash,
          hard: options.hard,
        });

        console.log(formatReset(result));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// config command (NEW)
// ============================================================================
program
  .command("config")
  .description("Manage gitgen configuration")
  .argument("<action>", "Action: get, set, list, unset")
  .argument("[key]", "Config key (e.g., provider, model)")
  .argument("[value]", "Config value (for set)")
  .action(
    async (
      action: string,
      key: string | undefined,
      value: string | undefined
    ) => {
      try {
        const result = await configCommand({
          action: action as "get" | "set" | "list" | "unset",
          key,
          value,
        });

        console.log(formatConfig(result));
      } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
      }
    }
  );

// ============================================================================
// provider command (NEW)
// ============================================================================
program
  .command("provider")
  .description("Manage LLM providers")
  .argument("<action>", "Action: list, models")
  .argument("[name]", "Provider name (for models)")
  .action(async (action: string, name: string | undefined) => {
    try {
      const result = await providerCommand({
        action: action as "list" | "models",
        provider: name,
      });

      console.log(formatProviders(result));
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// Parse and run
// ============================================================================
program.parse();
