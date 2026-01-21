import { Command } from "commander";
import {
  createResolver,
  createGitExtractor,
  formatGitContextForPrompt,
} from "@gen-md/core";

export const cascadeCommand = new Command("cascade")
  .description("Preview the cascade chain for a .gen.md file")
  .argument("<file>", "Target .gen.md file")
  .option("--stop-at <dir>", "Stop cascade at this directory")
  .option("--max-depth <n>", "Maximum cascade depth", "10")
  .option("--json", "Output as JSON", false)
  .option("--show-merged", "Show merged configuration", false)
  .option("--prompt", "Output as conversational prompt", false)
  .option("--git", "Include git context in output", false)
  .option("--git-commits <n>", "Number of git commits to include", "5")
  .action(async (file: string, options) => {
    const resolver = createResolver({
      stopAt: options.stopAt,
      maxDepth: parseInt(options.maxDepth, 10),
    });

    try {
      const result = await resolver.resolve(file);

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

      // Prompt output mode
      if (options.prompt) {
        const parts: string[] = [];

        parts.push("## Cascade Chain Analysis");
        parts.push(`Target: ${file}`);
        parts.push("");
        parts.push("### Chain (root to leaf):");
        result.chain.forEach((f, i) => {
          parts.push(`${i + 1}. ${f.filePath}`);
        });

        parts.push("");
        parts.push("### Merged Configuration:");
        parts.push(`- Context files: ${result.resolvedContext.length}`);
        parts.push(`- Skill files: ${result.resolvedSkills.length}`);
        if (result.frontmatter.output) {
          parts.push(`- Output: ${result.frontmatter.output}`);
        }
        if (result.frontmatter.name) {
          parts.push(`- Name: ${result.frontmatter.name}`);
        }

        if (gitContext) {
          parts.push("");
          parts.push(formatGitContextForPrompt(gitContext));
        }

        console.log(parts.join("\n"));
        return;
      }

      if (options.json) {
        const output = {
          chain: result.chain.map((f) => ({
            filePath: f.filePath,
            frontmatter: f.frontmatter,
          })),
          merged: options.showMerged
            ? {
                frontmatter: result.frontmatter,
                body: result.body,
                resolvedContext: result.resolvedContext,
                resolvedSkills: result.resolvedSkills,
              }
            : undefined,
          gitContext: options.git ? gitContext : undefined,
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log("Cascade Chain:");
        result.chain.forEach((f, i) => {
          console.log(`  ${i + 1}. ${f.filePath}`);
        });

        if (options.showMerged) {
          console.log("\nMerged Configuration:");
          console.log("  Context:", result.frontmatter.context ?? []);
          console.log("  Skills:", result.frontmatter.skills ?? []);
          if (result.frontmatter.output) {
            console.log("  Output:", result.frontmatter.output);
          }
          if (result.frontmatter.name) {
            console.log("  Name:", result.frontmatter.name);
          }
        }

        if (gitContext) {
          console.log("\nGit Context:");
          console.log(`  Branch: ${gitContext.branch}`);
          console.log(`  Recent commits: ${gitContext.commits.length}`);
          for (const commit of gitContext.commits.slice(0, 3)) {
            console.log(`    - ${commit.hash.substring(0, 7)} ${commit.subject}`);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Cascade resolution failed:", message);
      process.exit(1);
    }
  });
