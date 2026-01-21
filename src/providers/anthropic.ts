/**
 * Anthropic Provider
 *
 * Uses the Anthropic API (Claude) for content generation.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../types.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Available Anthropic models
 */
const MODELS = [
  "claude-opus-4-20250514",
  "claude-sonnet-4-20250514",
  "claude-3-5-haiku-20241022",
  "claude-3-5-sonnet-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
];

/**
 * Model aliases for convenience
 */
const MODEL_ALIASES: Record<string, string> = {
  "claude-opus-4": "claude-opus-4-20250514",
  "claude-sonnet-4": "claude-sonnet-4-20250514",
  opus: "claude-opus-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-3-5-haiku-20241022",
};

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic | null = null;

  constructor() {
    // Lazy initialization - only create client when needed
  }

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic();
    }
    return this.client;
  }

  /**
   * Resolve model alias to full model name
   */
  private resolveModel(model: string): string {
    return MODEL_ALIASES[model] || model;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const client = this.getClient();
    const model = this.resolveModel(options.model || DEFAULT_MODEL);

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature,
      system: options.systemPrompt,
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

    return {
      content,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      finishReason: response.stop_reason || "unknown",
    };
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncIterable<string> {
    const client = this.getClient();
    const model = this.resolveModel(options.model || DEFAULT_MODEL);

    const stream = client.messages.stream({
      model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }

  models(): string[] {
    return MODELS;
  }

  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }
}
