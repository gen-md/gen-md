import * as fs from "node:fs/promises";
import { Command } from "commander";
import {
  createCompactor,
  createSerializer,
  createGitExtractor,
  formatGitContextForPrompt,
  type ArrayMergeStrategy,
  type BodyMergeStrategy,
} from "@gen-md/core";

export const compactCommand = new Command("compact")
  .description("Merge multiple .gen.md files into a single consolidated file")
  .argument("<files...>", "Input .gen.md files to compact")
  .option("-o, --output <file>", "Output file path", "merged.gen.md")
  .option(
    "--array-merge <strategy>",
    "Array merge strategy: concatenate|dedupe|replace",
    "dedupe"
  )
  .option(
    "--body-merge <strategy>",
    "Body merge strategy: append|prepend|replace",
    "append"
  )
  .option("--resolve-paths", "Convert relative paths to absolute", false)
  .option("--base-path <path>", "Base path for relative path conversion")
  .option("--dry-run", "Preview output without writing file", false)
  .option("--prompt", "Output as conversational prompt", false)
  .option("--git", "Include git context", false)
  .action(async (files: string[], options) => {
    const compactor = createCompactor({
      arrayMerge: options.arrayMerge as ArrayMergeStrategy,
      bodyMerge: options.bodyMerge as BodyMergeStrategy,
      resolvePaths: options.resolvePaths,
      basePath: options.basePath,
      output: options.output,
    });

    try {
      const result = await compactor.compact(files);
      const serializer = createSerializer();
      const output = serializer.serialize(result);

      // Git context
      let gitContext = null;
      if (options.git && files.length > 0) {
        const gitExtractor = createGitExtractor();
        try {
          gitContext = await gitExtractor.extract(files[0]);
        } catch {
          // Not a git repository or git not available
        }
      }

      // Prompt output mode
      if (options.prompt) {
        const parts: string[] = [];

        parts.push("## Compaction Summary");
        parts.push("");
        parts.push(`Merged ${files.length} files into ${options.output}`);
        parts.push("");
        parts.push("### Source Files:");
        for (const file of files) {
          parts.push(`- ${file}`);
        }
        parts.push("");
        parts.push("### Merged Configuration:");
        parts.push(`- Context: ${result.frontmatter.context?.length ?? 0} files`);
        parts.push(`- Skills: ${result.frontmatter.skills?.length ?? 0} files`);
        parts.push(`- Examples: ${result.examples.length}`);

        if (gitContext) {
          parts.push("");
          parts.push(formatGitContextForPrompt(gitContext));
        }

        parts.push("");
        parts.push("### Output Preview:");
        parts.push("```yaml");
        parts.push(output.split("---")[1]?.trim() || "");
        parts.push("```");

        console.log(parts.join("\n"));
        return;
      }

      if (options.dryRun) {
        console.log("--- Preview ---");
        console.log(output);
        console.log("---------------");
        console.log(`Would write to: ${options.output}`);

        if (gitContext) {
          console.log("\nGit Context:");
          console.log(`  Branch: ${gitContext.branch}`);
        }
      } else {
        await fs.writeFile(options.output, output);
        console.log(`Compacted ${files.length} files into ${options.output}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Compaction failed:", message);
      process.exit(1);
    }
  });
