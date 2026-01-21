/**
 * OpenAI Provider Extension
 *
 * Sample extension that adds OpenAI as an LLM provider.
 * Demonstrates how to extend gitgen with custom LLM providers.
 *
 * Usage:
 *   1. Install openai: npm install openai
 *   2. Set OPENAI_API_KEY environment variable
 *   3. Load this extension
 *   4. Use --provider openai flag (or set as default)
 */

import type {
  Extension,
  ExtensionRegistry,
  LLMProvider,
  LLMOptions,
  LLMResponse,
} from "../../src/core/extensions.js";

/**
 * OpenAI Provider implementation
 *
 * Note: This is a sample implementation. In production, you would
 * import OpenAI from "openai" and use the actual SDK.
 */
class OpenAIProvider implements LLMProvider {
  name = "openai";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl =
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    if (!this.apiKey) {
      console.warn(
        "OPENAI_API_KEY not set. OpenAI provider will not work."
      );
    }
  }

  async generate(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model ?? "gpt-4o";
    const maxTokens = options?.maxTokens ?? 4096;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: options?.temperature ?? 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
      };
    };

    return {
      content: data.choices[0]?.message?.content ?? "",
      model: data.model,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    };
  }
}

/**
 * OpenAI Provider Extension
 */
export const openAIExtension: Extension = {
  name: "openai-provider",
  version: "1.0.0",
  description: "Adds OpenAI as an LLM provider for gitgen",

  activate(registry: ExtensionRegistry): void {
    registry.registerProvider(new OpenAIProvider());
  },
};

export default openAIExtension;
