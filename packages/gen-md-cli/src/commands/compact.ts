import * as fs from "node:fs/promises";
import { Command } from "commander";
import {
  createCompactor,
  createSerializer,
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

      if (options.dryRun) {
        console.log("--- Preview ---");
        console.log(output);
        console.log("---------------");
        console.log(`Would write to: ${options.output}`);
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
