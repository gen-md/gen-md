/**
 * Watch Command
 *
 * Watches .gitgen.md files for changes and automatically regenerates output.
 * Like having a live development server for your AI-generated content.
 */

import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import chalk from "chalk";
import { createParser } from "../core/parser.js";
import { createResolver } from "../core/resolver.js";
import { createStore, findGenMdRoot } from "../core/store.js";
import { createPredictor, buildPredictionContext } from "../core/predictor.js";
import { createGitExtractor } from "../git/context.js";
import { writeFile } from "node:fs/promises";

/**
 * Options for watch command
 */
export interface WatchOptions {
  /** Path to watch (default: current directory) */
  path?: string;
  /** Include git context in predictions */
  git?: boolean;
  /** Debounce time in ms (default: 500) */
  debounce?: number;
  /** Run initial generation for all modified specs */
  initial?: boolean;
}

/**
 * Result of a regeneration
 */
interface RegenerationResult {
  specPath: string;
  outputPath: string;
  success: boolean;
  error?: string;
  tokens?: { input: number; output: number };
}

/**
 * Execute watch command
 */
export async function watchCommand(options: WatchOptions = {}): Promise<void> {
  const targetPath = resolve(options.path || process.cwd());
  const debounceMs = options.debounce ?? 500;

  // Find gitgen root
  const maybeRoot = await findGenMdRoot(targetPath);
  if (!maybeRoot) {
    throw new Error(
      "Not a gitgen repository. Run 'gitgen init' to initialize."
    );
  }
  const root: string = maybeRoot;

  const store = createStore(root);
  const parser = createParser();
  const resolver = createResolver();
  const predictor = createPredictor();
  const gitExtractor = createGitExtractor();

  console.log(chalk.cyan(`\n👁️  Watching for .gitgen.md changes in ${chalk.bold(root)}\n`));

  // Track pending regenerations to debounce
  const pending = new Map<string, NodeJS.Timeout>();

  // Track specs and their outputs
  const specOutputMap = new Map<string, string>();

  // Find all specs and build map
  const allSpecs = await store.findAllSpecs();
  for (const specPath of allSpecs) {
    try {
      const resolved = await resolver.resolve(specPath);
      if (resolved.frontmatter.output) {
        specOutputMap.set(specPath, resolved.frontmatter.output);
      }
    } catch {
      // Skip invalid specs
    }
  }

  console.log(chalk.gray(`Found ${specOutputMap.size} specs with outputs\n`));

  // Run initial generation if requested
  if (options.initial) {
    console.log(chalk.yellow("Running initial generation for modified specs...\n"));
    for (const [specPath, outputPath] of specOutputMap.entries()) {
      await regenerate(specPath, outputPath);
    }
    console.log("");
  }

  /**
   * Regenerate a spec
   */
  async function regenerate(specPath: string, outputPath: string): Promise<RegenerationResult> {
    const relSpec = relative(root, specPath);
    const relOutput = relative(root, outputPath);

    console.log(chalk.gray(`Regenerating ${relSpec}...`));

    try {
      const resolved = await resolver.resolve(specPath);

      const gitContext = options.git
        ? await gitExtractor.extract(specPath)
        : null;

      const context = await buildPredictionContext(resolved, {
        gitContext,
        includeExisting: true,
      });

      const prediction = await predictor.predict(context);

      // Write output
      await writeFile(outputPath, prediction.content, "utf-8");

      console.log(
        chalk.green(`✓ ${relOutput}`) +
        chalk.gray(` (${prediction.inputTokens}/${prediction.outputTokens} tokens)`)
      );

      return {
        specPath,
        outputPath,
        success: true,
        tokens: { input: prediction.inputTokens, output: prediction.outputTokens },
      };
    } catch (error) {
      const errorMsg = (error as Error).message;
      console.log(chalk.red(`✗ ${relOutput}: ${errorMsg}`));
      return {
        specPath,
        outputPath,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Schedule a regeneration with debouncing
   */
  function scheduleRegenerate(specPath: string) {
    const outputPath = specOutputMap.get(specPath);
    if (!outputPath) return;

    // Clear any pending regeneration
    const existing = pending.get(specPath);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new regeneration
    pending.set(
      specPath,
      setTimeout(async () => {
        pending.delete(specPath);
        await regenerate(specPath, outputPath);
      }, debounceMs)
    );
  }

  // Set up file watcher
  const watcher = watch(root, { recursive: true }, async (eventType, filename) => {
    if (!filename) return;

    const fullPath = resolve(root, filename);

    // Check if it's a .gitgen.md file
    if (filename.endsWith(".gitgen.md")) {
      if (eventType === "change" || eventType === "rename") {
        // Re-resolve in case output path changed
        try {
          const resolved = await resolver.resolve(fullPath);
          if (resolved.frontmatter.output) {
            specOutputMap.set(fullPath, resolved.frontmatter.output);
            scheduleRegenerate(fullPath);
          }
        } catch {
          // Skip invalid specs
        }
      }
    }

    // Check if a context file changed - regenerate dependent specs
    for (const [specPath] of specOutputMap.entries()) {
      try {
        const resolved = await resolver.resolve(specPath);
        const contextPaths = resolved.frontmatter.context || [];

        if (contextPaths.some(cp => resolve(dirname(specPath), cp) === fullPath)) {
          console.log(chalk.gray(`Context file ${filename} changed, triggering ${relative(root, specPath)}`));
          scheduleRegenerate(specPath);
        }
      } catch {
        // Skip
      }
    }
  });

  console.log(chalk.gray("Press Ctrl+C to stop watching\n"));

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\nStopping watch..."));
    watcher.close();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}
