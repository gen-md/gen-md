/**
 * Ollama Provider
 *
 * Uses local Ollama server for content generation.
 * No API key required - runs locally.
 */

import type { LLMProvider, GenerateOptions, GenerateResult } from "../types.js";

const DEFAULT_MODEL = "llama3";
const DEFAULT_MAX_TOKENS = 8192;
const DEFAULT_BASE_URL = "http://localhost:11434";

/**
 * Common Ollama models
 */
const MODELS = [
  "llama3",
  "llama3:70b",
  "llama2",
  "codellama",
  "codellama:34b",
  "mistral",
  "mixtral",
  "phi3",
  "qwen2",
  "gemma2",
  "deepseek-coder",
];

export class OllamaProvider implements LLMProvider {
  name = "ollama";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_HOST || DEFAULT_BASE_URL;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model || DEFAULT_MODEL;

    // Build the full prompt with system prompt if provided
    let fullPrompt = prompt;
    if (options.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: false,
        options: {
          num_predict: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options.temperature,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as {
      response?: string;
      model?: string;
      prompt_eval_count?: number;
      eval_count?: number;
      done?: boolean;
    };

    return {
      content: data.response || "",
      model: data.model || model,
      inputTokens: data.prompt_eval_count || 0,
      outputTokens: data.eval_count || 0,
      finishReason: data.done ? "stop" : "unknown",
    };
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncIterable<string> {
    const model = options.model || DEFAULT_MODEL;

    // Build the full prompt with system prompt if provided
    let fullPrompt = prompt;
    if (options.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: true,
        options: {
          num_predict: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options.temperature,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line) as { response?: string };
          if (data.response) {
            yield data.response;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  models(): string[] {
    return MODELS;
  }

  /**
   * Check if Ollama is running
   */
  isConfigured(): boolean {
    // Ollama doesn't need an API key, just needs to be running
    // We return true here and let the actual call fail if Ollama isn't running
    return true;
  }

  /**
   * Check if Ollama server is actually running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of installed models
   */
  async installedModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      return (data.models || []).map((m) => m.name);
    } catch {
      return [];
    }
  }
}
