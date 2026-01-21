import * as fs from "node:fs/promises";
import * as path from "node:path";
import { CascadingResolver } from "../resolver/index.js";
import { mergeArrays } from "../utils/merge.js";
import type {
  GeneratedPrompt,
  OneShotExample,
  PromptOptions,
  ResolvedGenMdConfig,
} from "../types/index.js";

/**
 * Generator for conversational prompts from .gen.md files
 */
export class PromptGenerator {
  private resolver: CascadingResolver;
  private options: Required<PromptOptions>;

  constructor(options: PromptOptions = {}) {
    this.resolver = new CascadingResolver();
    this.options = {
      examplesMerge: options.examplesMerge ?? "dedupe",
      includeCurrentOutput: options.includeCurrentOutput ?? true,
      userPrompt: options.userPrompt ?? "",
    };
  }

  /**
   * Generate a conversational prompt from a .gen.md file
   */
  async generate(genMdPath: string): Promise<GeneratedPrompt> {
    // Resolve the cascade chain
    const resolved = await this.resolver.resolve(genMdPath);

    // Merge examples from all cascade levels
    const examples = this.mergeExamples(resolved);

    // Get body content (user prompt)
    const body = this.options.userPrompt || resolved.body;

    // Read current output file content if exists
    const currentCode = await this.readCurrentCode(resolved);

    // Build the prompt string
    const prompt = this.buildPrompt(examples, body, currentCode, resolved.body);

    return {
      prompt,
      examples,
      body,
      currentCode,
      sourcePath: genMdPath,
    };
  }

  /**
   * Merge examples from all files in the cascade chain
   */
  private mergeExamples(resolved: ResolvedGenMdConfig): OneShotExample[] {
    // Collect examples from all files in chain
    const allExamples = resolved.chain.reduce<OneShotExample[]>(
      (acc, file) => {
        return mergeArrays(acc, file.examples, this.options.examplesMerge);
      },
      []
    );

    return allExamples;
  }

  /**
   * Read current output file content if it exists
   */
  private async readCurrentCode(
    resolved: ResolvedGenMdConfig
  ): Promise<string | null> {
    if (!this.options.includeCurrentOutput) {
      return null;
    }

    const outputPath = resolved.frontmatter.output;
    if (!outputPath) {
      return null;
    }

    // Get the leaf file's directory for relative path resolution
    const leafFile = resolved.chain[resolved.chain.length - 1];
    const absolutePath = path.resolve(path.dirname(leafFile.filePath), outputPath);

    try {
      return await fs.readFile(absolutePath, "utf-8");
    } catch {
      // File doesn't exist yet
      return null;
    }
  }

  /**
   * Build the conversational prompt string
   */
  private buildPrompt(
    examples: OneShotExample[],
    userPrompt: string,
    currentCode: string | null,
    currentSpec: string
  ): string {
    const parts: string[] = [];

    // Add explicit examples from .gen.md files
    for (const example of examples) {
      parts.push(`<one-shot-example>
${example.input}
---
${example.output}
</one-shot-example>`);
    }

    // Add current state as example (if output exists)
    if (currentCode && this.options.includeCurrentOutput) {
      parts.push(`<one-shot-example>
${currentSpec}
---
${currentCode}
</one-shot-example>`);
    }

    // Add the user prompt
    parts.push(userPrompt);

    return parts.join("\n\n");
  }
}

/**
 * Factory function to create a PromptGenerator
 */
export function createPromptGenerator(
  options?: PromptOptions
): PromptGenerator {
  return new PromptGenerator(options);
}
