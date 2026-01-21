import * as fs from "node:fs/promises";
import { Command } from "commander";
import { createPromptGenerator } from "@gen-md/core";
import type { ArrayMergeStrategy } from "@gen-md/core";

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
  .action(async (file: string, options) => {
    const generator = createPromptGenerator({
      examplesMerge: options.examplesMerge as ArrayMergeStrategy,
      includeCurrentOutput: options.currentCode !== false,
      userPrompt: options.userPrompt,
    });

    try {
      const result = await generator.generate(file);

      if (options.json) {
        const output = JSON.stringify(result, null, 2);
        if (options.output) {
          await fs.writeFile(options.output, output);
          console.log(`Wrote JSON to ${options.output}`);
        } else {
          console.log(output);
        }
      } else {
        if (options.output) {
          await fs.writeFile(options.output, result.prompt);
          console.log(`Wrote prompt to ${options.output}`);
        } else {
          console.log(result.prompt);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Prompt generation failed:", message);
      process.exit(1);
    }
  });
