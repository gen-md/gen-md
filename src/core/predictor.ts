/**
 * Content Predictor
 *
 * Uses Anthropic API to generate predicted content from .gen.md specs.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type {
  PredictedContent,
  PredictionContext,
  PredictorOptions,
  ResolvedGenMdConfig,
} from "../types.js";
import { formatGitContextForPrompt } from "../git/context.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Content predictor using Anthropic API
 */
export class Predictor {
  private client: Anthropic;
  private options: Required<PredictorOptions>;

  constructor(options: PredictorOptions = {}) {
    this.client = new Anthropic();
    this.options = {
      model: options.model ?? DEFAULT_MODEL,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    };
  }

  /**
   * Generate predicted content from a spec
   */
  async predict(context: PredictionContext): Promise<PredictedContent> {
    const prompt = this.buildPrompt(context);

    const response = await this.client.messages.create({
      model: this.options.model,
      max_tokens: this.options.maxTokens,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Strip any markdown code fences if the model wrapped the output
    const cleanContent = this.stripCodeFences(content);

    return {
      content: cleanContent,
      hash: createHash("sha256").update(cleanContent).digest("hex"),
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  /**
   * Build the prompt for the API call
   */
  private buildPrompt(context: PredictionContext): string {
    const { config, gitContext, existingContent, referencedFiles } = context;
    const parts: string[] = [];

    // System context
    parts.push("You are a content generator. Generate the requested content based on the spec and context provided.");
    parts.push("Output ONLY the generated content - no explanations, no markdown code fences, just the raw content.\n");

    // Spec information
    parts.push("# Generation Spec\n");

    if (config.frontmatter.name) {
      parts.push(`**Name:** ${config.frontmatter.name}`);
    }
    if (config.frontmatter.description) {
      parts.push(`**Description:** ${config.frontmatter.description}`);
    }
    if (config.frontmatter.output) {
      parts.push(`**Output File:** ${config.frontmatter.output}`);
    }
    parts.push("");

    // Referenced context files
    if (referencedFiles.size > 0) {
      parts.push("# Context Files\n");
      for (const [path, content] of referencedFiles) {
        parts.push(`## ${path}\n`);
        parts.push("```");
        parts.push(content);
        parts.push("```\n");
      }
    }

    // Git context
    if (gitContext) {
      parts.push(formatGitContextForPrompt(gitContext));
      parts.push("");
    }

    // Existing content (if any)
    if (existingContent) {
      parts.push("# Current Content\n");
      parts.push("The output file currently contains:");
      parts.push("```");
      parts.push(existingContent);
      parts.push("```\n");
    }

    // One-shot examples
    if (config.examples.length > 0) {
      parts.push("# Examples\n");
      for (const example of config.examples) {
        parts.push("<example>");
        parts.push("Input:");
        parts.push(example.input);
        parts.push("---");
        parts.push("Output:");
        parts.push(example.output);
        parts.push("</example>\n");
      }
    }

    // The actual generation instructions (body)
    parts.push("# Generation Instructions\n");
    parts.push(config.body);
    parts.push("");

    // Final instruction
    parts.push("---");
    parts.push("Generate the content now. Output ONLY the content, nothing else.");

    return parts.join("\n");
  }

  /**
   * Strip markdown code fences from output
   */
  private stripCodeFences(content: string): string {
    // Match ```language\n...\n``` or ```\n...\n```
    const fencePattern = /^```[\w]*\n([\s\S]*?)\n```$/;
    const match = content.trim().match(fencePattern);
    return match ? match[1] : content;
  }
}

/**
 * Build prediction context from resolved config
 */
export async function buildPredictionContext(
  config: ResolvedGenMdConfig,
  options: {
    gitContext?: PredictionContext["gitContext"];
    includeExisting?: boolean;
  } = {}
): Promise<PredictionContext> {
  const referencedFiles = new Map<string, string>();

  // Read context files
  const contextPaths = config.frontmatter.context || [];
  for (const path of contextPaths) {
    try {
      const content = await readFile(path, "utf-8");
      referencedFiles.set(path, content);
    } catch {
      // Skip files that can't be read
    }
  }

  // Read existing output content if requested
  let existingContent: string | null = null;
  if (options.includeExisting && config.frontmatter.output) {
    try {
      existingContent = await readFile(config.frontmatter.output, "utf-8");
    } catch {
      // Output doesn't exist yet
    }
  }

  return {
    config,
    gitContext: options.gitContext ?? null,
    existingContent,
    referencedFiles,
  };
}

/**
 * Create a predictor instance
 */
export function createPredictor(options?: PredictorOptions): Predictor {
  return new Predictor(options);
}
