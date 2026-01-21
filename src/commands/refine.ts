/**
 * Refine Command
 *
 * Interactive refinement session for a spec.
 * Allows chat-based iteration on generated content.
 */

import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { runTerminalRefine } from "../refine/terminal.js";
import { createResolver } from "../core/resolver.js";
import { GenMdStore } from "../core/store.js";
import { createGitExtractor } from "../git/context.js";

/**
 * Refine command options
 */
export interface RefineCommandOptions {
  spec: string;
  provider?: string;
  model?: string;
  git?: boolean;
}

/**
 * Refine command result
 */
export interface RefineCommandResult {
  accepted: boolean;
  outputPath?: string;
  versions: number;
  totalTokens: {
    input: number;
    output: number;
  };
}

/**
 * Execute the refine command
 */
export async function refineCommand(options: RefineCommandOptions): Promise<RefineCommandResult> {
  const specPath = resolve(options.spec);

  // Parse and validate the spec
  const resolver = createResolver();
  const resolved = await resolver.resolve(specPath);

  if (!resolved.frontmatter.output) {
    throw new Error("Spec must have an 'output' field");
  }

  // Get git context if requested
  let gitContext = null;
  if (options.git) {
    try {
      const gitExtractor = createGitExtractor();
      gitContext = await gitExtractor.extract(dirname(specPath));
    } catch {
      // Git context not available
    }
  }

  // Run interactive refinement
  const result = await runTerminalRefine(specPath, {
    provider: options.provider,
    model: options.model,
    gitContext,
  });

  if (result.accepted && result.content) {
    // Write the output file
    const outputPath = resolve(dirname(specPath), resolved.frontmatter.output);
    await writeFile(outputPath, result.content, "utf-8");

    // Log to store
    try {
      const store = new GenMdStore(dirname(specPath));
      if (await store.isInitialized()) {
        const hash = await store.writeObject(result.content);
        await store.appendLog({
          hash,
          message: `Refined via interactive session (${result.session.history.length} versions)`,
          specPath,
          outputPath,
          contentHash: hash,
          timestamp: new Date(),
          model: result.session.history[result.session.history.length - 1]?.model || "unknown",
          tokens: result.session.history.reduce(
            (acc, entry) => ({
              input: acc.input + entry.tokens.input,
              output: acc.output + entry.tokens.output,
            }),
            { input: 0, output: 0 }
          ),
        });
      }
    } catch {
      // Store logging failed, but that's ok
    }

    console.log(chalk.green(`\n✓ Saved to ${resolved.frontmatter.output}`));

    return {
      accepted: true,
      outputPath: resolved.frontmatter.output,
      versions: result.session.history.length,
      totalTokens: result.session.history.reduce(
        (acc, entry) => ({
          input: acc.input + entry.tokens.input,
          output: acc.output + entry.tokens.output,
        }),
        { input: 0, output: 0 }
      ),
    };
  }

  return {
    accepted: false,
    versions: result.session.history.length,
    totalTokens: result.session.history.reduce(
      (acc, entry) => ({
        input: acc.input + entry.tokens.input,
        output: acc.output + entry.tokens.output,
      }),
      { input: 0, output: 0 }
    ),
  };
}
