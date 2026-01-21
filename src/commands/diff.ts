/**
 * Diff Command
 *
 * Shows the difference between current file and predicted content from spec.
 * Like `git diff`.
 */

import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import chalk from "chalk";
import { createParser } from "../core/parser.js";
import { createResolver } from "../core/resolver.js";
import { createStore, findGenMdRoot } from "../core/store.js";
import { createPredictor, buildPredictionContext } from "../core/predictor.js";
import { createDiffer } from "../core/differ.js";
import { createGitExtractor } from "../git/context.js";
import type { FileDiff, PredictedContent } from "../types.js";

/**
 * Options for diff command
 */
export interface DiffOptions {
  /** Path to the .gitgen.md spec */
  spec: string;
  /** Show staged predictions (skip regeneration) */
  cached?: boolean;
  /** Include git context in prediction */
  git?: boolean;
  /** Output as JSON */
  json?: boolean;
  /** Dry run - show what would be generated without calling API */
  dryRun?: boolean;
}

/**
 * Result of diff command
 */
export interface DiffResult {
  /** Path to the spec file */
  specPath: string;
  /** Path to the output file */
  outputPath: string;
  /** The diff */
  diff: FileDiff;
  /** Prediction details (if generated) */
  prediction?: PredictedContent;
}

/**
 * Execute diff command
 */
export async function diffCommand(options: DiffOptions): Promise<DiffResult> {
  const specPath = resolve(options.spec);

  // Find gitgen root
  const root = await findGenMdRoot(dirname(specPath));
  if (!root) {
    throw new Error(
      "Not a gitgen repository. Run 'gitgen init' to initialize."
    );
  }

  const store = createStore(root);
  const parser = createParser();
  const resolver = createResolver();
  const differ = createDiffer();

  // Parse and resolve the spec
  const resolved = await resolver.resolve(specPath);

  const outputPath = resolved.frontmatter.output;
  if (!outputPath) {
    throw new Error("Spec has no output field - nothing to diff");
  }

  // Read current output content
  let currentContent = "";
  try {
    currentContent = await readFile(outputPath, "utf-8");
  } catch {
    // Output doesn't exist yet
  }

  let predictedContent: string;
  let prediction: PredictedContent | undefined;

  if (options.cached) {
    // Use cached prediction from store if available
    const stagedSpecs = await store.getStagedSpecs();
    const staged = stagedSpecs.find((s) => s.specPath === specPath);

    if (staged?.predictedHash) {
      predictedContent = await store.readObject(staged.predictedHash);
    } else {
      throw new Error("No cached prediction available. Run without --cached to generate.");
    }
  } else if (options.dryRun) {
    // Dry run - show what the prompt would look like
    const gitContext = options.git
      ? await createGitExtractor().extract(specPath)
      : null;

    const context = await buildPredictionContext(resolved, {
      gitContext,
      includeExisting: true,
    });

    // For dry run, show the context that would be sent
    predictedContent = `[DRY RUN - Would generate content based on spec]\n\nSpec: ${specPath}\nOutput: ${outputPath}\nContext files: ${Array.from(context.referencedFiles.keys()).join(", ") || "none"}\nGit context: ${gitContext ? "yes" : "no"}\n`;
  } else {
    // Generate new prediction using Anthropic API
    console.error(chalk.gray("Generating prediction..."));

    const predictor = createPredictor();
    const gitContext = options.git
      ? await createGitExtractor().extract(specPath)
      : null;

    const context = await buildPredictionContext(resolved, {
      gitContext,
      includeExisting: true,
    });

    prediction = await predictor.predict(context);
    predictedContent = prediction.content;

    // Cache the prediction
    await store.writeObject(predictedContent);

    console.error(
      chalk.gray(
        `Generated with ${prediction.model} (${prediction.inputTokens} in / ${prediction.outputTokens} out)`
      )
    );
  }

  // Generate diff
  const diff = differ.diff(
    relative(root, outputPath),
    currentContent,
    predictedContent
  );

  return {
    specPath,
    outputPath,
    diff,
    prediction,
  };
}

/**
 * Format diff result for display
 */
export function formatDiff(result: DiffResult, colored = true): string {
  const differ = createDiffer();

  if (colored) {
    return differ.formatDiffColored(result.diff);
  }

  return differ.formatDiff(result.diff);
}
