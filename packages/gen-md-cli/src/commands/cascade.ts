import { Command } from "commander";
import { createResolver } from "@gen-md/core";

export const cascadeCommand = new Command("cascade")
  .description("Preview the cascade chain for a .gen.md file")
  .argument("<file>", "Target .gen.md file")
  .option("--stop-at <dir>", "Stop cascade at this directory")
  .option("--max-depth <n>", "Maximum cascade depth", "10")
  .option("--json", "Output as JSON", false)
  .option("--show-merged", "Show merged configuration", false)
  .action(async (file: string, options) => {
    const resolver = createResolver({
      stopAt: options.stopAt,
      maxDepth: parseInt(options.maxDepth, 10),
    });

    try {
      const result = await resolver.resolve(file);

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
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Cascade resolution failed:", message);
      process.exit(1);
    }
  });
