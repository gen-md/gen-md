/**
 * OpenAI Provider
 *
 * Uses the OpenAI API (GPT) for content generation.
 */

import OpenAI from "openai";
import type { LLMProvider, GenerateOptions, GenerateResult } from "../types.js";

const DEFAULT_MODEL = "gpt-4o";
const DEFAULT_MAX_TOKENS = 8192;

/**
 * Available OpenAI models
 */
const MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o1-preview",
];

/**
 * Model aliases for convenience
 */
const MODEL_ALIASES: Record<string, string> = {
  gpt4: "gpt-4o",
  "gpt-4": "gpt-4o",
  gpt4o: "gpt-4o",
  gpt4mini: "gpt-4o-mini",
  gpt35: "gpt-3.5-turbo",
};

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client: OpenAI | null = null;

  constructor() {
    // Lazy initialization - only create client when needed
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI();
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

    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const response = await client.chat.completions.create({
      model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature,
      messages,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || "";

    return {
      content,
      model: response.model,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      finishReason: choice?.finish_reason || "unknown",
    };
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncIterable<string> {
    const client = this.getClient();
    const model = this.resolveModel(options.model || DEFAULT_MODEL);

    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({
        role: "system",
        content: options.systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const stream = await client.chat.completions.create({
      model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  models(): string[] {
    return MODELS;
  }

  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}
