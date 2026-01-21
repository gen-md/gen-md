/**
 * Content Predictor
 *
 * Uses LLM providers to generate predicted content from .gitgen.md specs.
 * Loads prompts from external markdown files for easy customization.
 */

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
import { providers } from "../providers/index.js";

const DEFAULT_MAX_TOKENS = 8192;

/**
 * Extended options including provider
 */
export interface ExtendedPredictorOptions extends PredictorOptions {
  /** Provider to use (default: from config or anthropic) */
  provider?: string;
}

/**
 * Content predictor using configurable LLM providers
 */
export class Predictor {
  private options: ExtendedPredictorOptions;

  constructor(options: ExtendedPredictorOptions = {}) {
    this.options = {
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      provider: options.provider,
      model: options.model,
    };
  }

  /**
   * Generate predicted content from a spec
   */
  async predict(context: PredictionContext): Promise<PredictedContent> {
    const prompt = await this.buildPrompt(context);
    const providerName = this.options.provider || providers.getDefaultName();
    const provider = providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    // Get model from options, spec frontmatter, or provider default
    const model =
      this.options.model ||
      (context.config.frontmatter as Record<string, unknown>).model as string ||
      provider.models()[0];

    const result = await providers.generate(prompt, {
      model,
      maxTokens: this.options.maxTokens,
      provider: providerName,
    });

    // Strip any markdown code fences if the model wrapped the output
    const cleanContent = this.stripCodeFences(result.content);

    return {
      content: cleanContent,
      hash: createHash("sha256").update(cleanContent).digest("hex"),
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    };
  }

  /**
   * Stream predicted content from a spec
   */
  async *stream(context: PredictionContext): AsyncIterable<string> {
    const prompt = await this.buildPrompt(context);
    const providerName = this.options.provider || providers.getDefaultName();
    const provider = providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    if (!provider.stream) {
      throw new Error(`Provider "${providerName}" does not support streaming`);
    }

    const model =
      this.options.model ||
      (context.config.frontmatter as Record<string, unknown>).model as string ||
      provider.models()[0];

    yield* providers.stream(prompt, {
      model,
      maxTokens: this.options.maxTokens,
      provider: providerName,
    });
  }

  /**
   * Build the prompt for the API call using external templates
   */
  async buildPrompt(context: PredictionContext): Promise<string> {
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
export function createPredictor(options?: ExtendedPredictorOptions): Predictor {
  return new Predictor(options);
}
