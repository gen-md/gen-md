import * as fs from "node:fs/promises";
import { Command } from "commander";
import {
  createPromptGenerator,
  createGitExtractor,
  createGitHubClient,
  resolveGitHubAuth,
  parseGitHubRepo,
  formatGitContextForPrompt,
} from "@gen-md/core";
import type { ArrayMergeStrategy, PRExample } from "@gen-md/core";

export const promptCommand = new Command("prompt")
  .description("Generate a conversational prompt from a .gen.md file")
  .argument("<file>", "Target .gen.md file")
  .option("-o, --output <file>", "Write prompt to file instead of stdout")
  .option("--no-current-code", "Don't include current output file content")
  .option("--user-prompt <text>", "Override the user prompt")
  .option(
    "--examples-merge <strategy>",
    "Examples merge strategy: concatenate|prepend|replace|dedupe",
    "dedupe"
  )
  .option("--json", "Output as JSON structure", false)
  .option("--git", "Include git context", false)
  .option("--git-commits <n>", "Number of git commits to include", "5")
  .option("--from-pr <number>", "Use specific PR as example")
  .option("--max-pr-examples <n>", "Maximum PR examples to fetch", "3")
  .action(async (file: string, options) => {
    const generator = createPromptGenerator({
      examplesMerge: options.examplesMerge as ArrayMergeStrategy,
      includeCurrentOutput: options.currentCode !== false,
      userPrompt: options.userPrompt,
    });

    try {
      const result = await generator.generate(file);

      // Git context
      let gitContext = null;
      if (options.git) {
        const gitExtractor = createGitExtractor({
          maxCommits: parseInt(options.gitCommits, 10),
        });
        try {
          gitContext = await gitExtractor.extract(file);
        } catch {
          // Not a git repository or git not available
        }
      }

      // PR examples
      const prExamples: PRExample[] = [];
      if (options.fromPr && gitContext?.remoteUrl) {
        const auth = await resolveGitHubAuth();
        if (auth) {
          const repo = parseGitHubRepo(gitContext.remoteUrl);
          if (repo) {
            const github = createGitHubClient(auth);
            const pr = await github.getPR(
              repo.owner,
              repo.repo,
              parseInt(options.fromPr, 10)
            );
            if (pr) {
              prExamples.push(github.prToExample(pr, ""));
            }
          }
        }
      }

      // Enhanced output with git/PR context
      const enhancedResult = {
        ...result,
        gitContext,
        prExamples,
      };

      // Build enhanced prompt if git context requested
      let finalPrompt = result.prompt;
      if (gitContext) {
        finalPrompt = formatGitContextForPrompt(gitContext) + "\n\n" + finalPrompt;
      }
      if (prExamples.length > 0) {
        const prSection = prExamples
          .map(
            (ex) =>
              `<pr-example>\nPR #${ex.prNumber}: ${ex.prTitle}\n---\n${ex.output}\n</pr-example>`
          )
          .join("\n\n");
        finalPrompt = prSection + "\n\n" + finalPrompt;
      }

      if (options.json) {
        const output = JSON.stringify(enhancedResult, null, 2);
        if (options.output) {
          await fs.writeFile(options.output, output);
          console.log(`Wrote JSON to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        if (options.output) {
          await fs.writeFile(options.output, finalPrompt);
          console.log(`Wrote prompt to ${options.output}`);
        } else {
          console.log(finalPrompt);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Prompt generation failed:", message);
      process.exit(1);
    }
  });
