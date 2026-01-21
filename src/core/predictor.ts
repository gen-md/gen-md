/**
 * Content Predictor
 *
 * Uses Anthropic API to generate predicted content from .gen.md specs.
 * Loads prompts from external markdown files for easy customization.
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
import { loadPrompt, interpolate, loadSkills } from "./prompt-loader.js";

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
    const prompt = await this.buildPrompt(context);

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
   * Build the prompt for the API call using external templates
   */
  private async buildPrompt(context: PredictionContext): Promise<string> {
    const { config, gitContext, existingContent, referencedFiles } = context;
    const parts: string[] = [];

    // Load and add system prompt
    const systemPrompt = await loadPrompt("system");
    parts.push(systemPrompt);
    parts.push("");

    // Load and add spec section
    const specTemplate = await loadPrompt("spec-section");
    const specContent = interpolate(specTemplate, {
      name: config.frontmatter.name,
      description: config.frontmatter.description,
      output: config.frontmatter.output,
    });
    if (specContent.trim()) {
      parts.push(specContent);
      parts.push("");
    }

    // Add referenced context files
    if (referencedFiles.size > 0) {
      const contextTemplate = await loadPrompt("context-section");
      const files = Array.from(referencedFiles.entries()).map(
        ([path, content]) => ({ path, content })
      );
      const contextContent = interpolate(contextTemplate, { files });
      parts.push(contextContent);
    }

    // Add skills (domain knowledge)
    const skillPaths = config.frontmatter.skills || [];
    if (skillPaths.length > 0) {
      const skills = await loadSkills(skillPaths);
      if (skills.length > 0) {
        const skillsTemplate = await loadPrompt("skills-section");
        const skillsContent = interpolate(skillsTemplate, { skills });
        parts.push(skillsContent);
      }
    }

    // Add git context
    if (gitContext) {
      parts.push(formatGitContextForPrompt(gitContext));
      parts.push("");
    }

    // Add existing content (if any)
    if (existingContent) {
      const existingTemplate = await loadPrompt("existing-content-section");
      const existingSection = interpolate(existingTemplate, {
        content: existingContent,
      });
      parts.push(existingSection);
    }

    // Add one-shot examples
    if (config.examples.length > 0) {
      const examplesTemplate = await loadPrompt("examples-section");
      const examplesContent = interpolate(examplesTemplate, {
        examples: config.examples,
      });
      parts.push(examplesContent);
    }

    // Add generation instructions (body)
    const instructionsTemplate = await loadPrompt("instructions-section");
    const instructionsContent = interpolate(instructionsTemplate, {
      body: config.body,
    });
    parts.push(instructionsContent);
    parts.push("");

    // Add final instruction
    const finalInstruction = await loadPrompt("final-instruction");
    parts.push(finalInstruction);

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
