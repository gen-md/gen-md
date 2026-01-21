import * as fs from "node:fs/promises";
import { Command } from "commander";
import {
  createResolver,
  createPromptGenerator,
  createGitExtractor,
  createPRGenerator,
  createGitHubClient,
  resolveGitHubAuth,
  parseGitHubRepo,
  formatPRForGhCli,
} from "@gen-md/core";
import type { PRExample } from "@gen-md/core";

export const prCommand = new Command("pr")
  .description("Generate PR-ready output from a .gen.md file")
  .argument("<file>", "Target .gen.md file")
  .option("--title <title>", "PR title")
  .option("--base <branch>", "Base branch", "main")
  .option("--draft", "Create as draft PR", true)
  .option("--labels <labels>", "Comma-separated labels")
  .option("--from-pr <number>", "Use specific PR as example")
  .option("--max-pr-examples <n>", "Maximum PR examples", "3")
  .option("-o, --output <file>", "Write PR spec to file")
  .option("--create", "Output gh CLI command to create PR", false)
  .option("--json", "Output as JSON", false)
  .action(async (file: string, options) => {
    try {
      // Resolve cascade
      const resolver = createResolver();
      const resolved = await resolver.resolve(file);

      // Extract git context
      const gitExtractor = createGitExtractor({ maxCommits: 10 });
      let gitContext = null;
      try {
        gitContext = await gitExtractor.extract(file);
      } catch {
        // Not a git repository
      }

      // Get PR examples if we have GitHub access
      const prExamples: PRExample[] = [];
      const auth = await resolveGitHubAuth();

      if (auth && gitContext?.remoteUrl) {
        const repo = parseGitHubRepo(gitContext.remoteUrl);
        if (repo) {
          const github = createGitHubClient(auth);

          if (options.fromPr) {
            // Get specific PR
            const pr = await github.getPR(
              repo.owner,
              repo.repo,
              parseInt(options.fromPr, 10)
            );
            if (pr) {
              prExamples.push(
                github.prToExample(pr, resolved.frontmatter.output || "")
              );
            }
          } else {
            // Get recent merged PRs that touched this file
            try {
              const prs = await github.getMergedPRsForFiles(
                repo.owner,
                repo.repo,
                [resolved.frontmatter.output || ""].filter(Boolean),
                { maxPRs: parseInt(options.maxPrExamples, 10) }
              );
              for (const pr of prs) {
                prExamples.push(
                  github.prToExample(pr, resolved.frontmatter.output || "")
                );
              }
            } catch {
              // GitHub API error - continue without PR examples
            }
          }
        }
      }

      // Generate prompt with examples
      const promptGenerator = createPromptGenerator({
        includeCurrentOutput: true,
      });
      const promptResult = await promptGenerator.generate(file);

      // Create PR generator
      const prGenerator = createPRGenerator({
        title: options.title,
        base: options.base,
        draft: options.draft,
        labels: options.labels?.split(",") || [],
      });

      // Generate PR output
      const pr = prGenerator.generate(
        resolved,
        promptResult.prompt,
        gitContext,
        prExamples
      );

      // Output
      if (options.json) {
        const output = JSON.stringify(pr, null, 2);
        if (options.output) {
          await fs.writeFile(options.output, output);
          console.log(`Wrote PR spec to ${options.output}`);
        } else {
          console.log(output);
        }
      } else if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(pr, null, 2));
        console.log(`Wrote PR spec to ${options.output}`);
      } else if (options.create) {
        // Output gh CLI command
        console.log("Run the following command to create PR:");
        console.log("");
        console.log(formatPRForGhCli(pr));
      } else {
        // Human-readable output
        console.log("Generated PR:");
        console.log(`  Title: ${pr.title}`);
        console.log(`  Base: ${pr.base}`);
        console.log(`  Head: ${pr.head}`);
        console.log(`  Files: ${pr.files.length}`);
        console.log(`  Labels: ${pr.labels.join(", ") || "(none)"}`);
        console.log("");
        console.log("PR Body:");
        console.log(pr.body);

        if (prExamples.length > 0) {
          console.log("");
          console.log(`Referenced ${prExamples.length} PR examples`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("PR generation failed:", message);
      process.exit(1);
    }
  });
