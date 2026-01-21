/**
 * Commit Command
 *
 * Regenerates all staged specs and writes output files.
 * Like `git commit`.
 */

import { writeFile, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import chalk from "chalk";
import { createParser } from "../core/parser.js";
import { createResolver } from "../core/resolver.js";
import { createStore, findGenMdRoot } from "../core/store.js";
import { createPredictor, buildPredictionContext } from "../core/predictor.js";
import { createGitExtractor } from "../git/context.js";
import type { CommitResult, LogEntry } from "../types.js";

/**
 * Options for commit command
 */
export interface CommitOptions {
  /** Commit message */
  message?: string;
  /** Include git context in predictions */
  git?: boolean;
  /** Preview without writing files */
  dryRun?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Execute commit command
 */
export async function commitCommand(
  options: CommitOptions = {}
): Promise<CommitResult> {
  // Find gitgen root
  const root = await findGenMdRoot(process.cwd());
  if (!root) {
    throw new Error(
      "Not a gitgen repository. Run 'gitgen init' to initialize."
    );
  }

  const store = createStore(root);
  const parser = createParser();
  const resolver = createResolver();
  const predictor = createPredictor();

  // Get staged specs
  const stagedSpecs = await store.getStagedSpecs();
  if (stagedSpecs.length === 0) {
    throw new Error("Nothing to commit. Use 'gitgen add' to stage specs.");
  }

  const branch = await store.getHead();
  const message = options.message || `Generate ${stagedSpecs.length} file(s)`;

  const files: CommitResult["files"] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  console.error(chalk.bold(`Committing ${stagedSpecs.length} spec(s)...\n`));

  for (const staged of stagedSpecs) {
    const relSpec = relative(root, staged.specPath);
    const relOutput = relative(root, staged.outputPath);

    console.error(chalk.gray(`  Generating: ${relSpec} -> ${relOutput}`));

    try {
      // Resolve the spec
      const resolved = await resolver.resolve(staged.specPath);

      // Build prediction context
      const gitContext = options.git
        ? await createGitExtractor().extract(staged.specPath)
        : null;

      const context = await buildPredictionContext(resolved, {
        gitContext,
        includeExisting: true,
      });

      // Generate prediction
      const prediction = await predictor.predict(context);

      totalInputTokens += prediction.inputTokens;
      totalOutputTokens += prediction.outputTokens;

      if (!options.dryRun) {
        // Write the output file
        await writeFile(staged.outputPath, prediction.content, "utf-8");

        // Store the object
        await store.writeObject(prediction.content);

        // Log the generation
        const logEntry: LogEntry = {
          hash: prediction.hash,
          message,
          specPath: staged.specPath,
          outputPath: staged.outputPath,
          contentHash: prediction.hash,
          timestamp: new Date(),
          model: prediction.model,
          tokens: {
            input: prediction.inputTokens,
            output: prediction.outputTokens,
          },
        };
        await store.appendLog(logEntry);
      }

      files.push({
        specPath: staged.specPath,
        outputPath: staged.outputPath,
        contentHash: prediction.hash,
      });

      console.error(
        chalk.green(
          `  ✓ ${relOutput} (${prediction.inputTokens}/${prediction.outputTokens} tokens)`
        )
      );
    } catch (error) {
      console.error(
        chalk.red(`  ✗ Failed: ${relSpec} - ${(error as Error).message}`)
      );
      throw error;
    }
  }

  // Create commit hash
  const commitHash = store.createCommitHash(message, files);

  if (!options.dryRun) {
    // Update branch ref
    await store.updateBranchRef(branch, commitHash);

    // Clear staged specs
    await store.clearStaged();
  }

  console.error("");
  console.error(
    chalk.bold(
      options.dryRun
        ? chalk.yellow("[DRY RUN] Would commit:")
        : chalk.green("Committed:")
    )
  );
  console.error(chalk.gray(`  ${commitHash.slice(0, 7)} ${message}`));
  console.error(
    chalk.gray(
      `  ${files.length} file(s), ${totalInputTokens + totalOutputTokens} total tokens`
    )
  );

  return {
    hash: commitHash,
    message,
    files,
    totalTokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
    },
  };
}

/**
 * Format commit result for display
 */
export function formatCommitResult(
  result: CommitResult,
  root: string
): string {
  const lines: string[] = [];

  lines.push(chalk.bold.green(`[${result.hash.slice(0, 7)}] ${result.message}`));
  lines.push("");

  for (const file of result.files) {
    const relOutput = relative(root, file.outputPath);
    lines.push(chalk.green(` create ${relOutput}`));
  }

  lines.push("");
  lines.push(
    chalk.gray(
      `${result.files.length} file(s) changed, ${result.totalTokens.input + result.totalTokens.output} tokens used`
    )
  );

  return lines.join("\n");
}
