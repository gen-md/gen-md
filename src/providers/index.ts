import { anthropic } from "@ai-sdk/anthropic";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export type ProviderType = "anthropic" | "bedrock" | "openrouter" | "openai" | "google";

export interface ProviderConfig {
  provider: ProviderType;
}

export interface LLMResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Model mappings per provider
const MODEL_MAPPINGS: Record<ProviderType, Record<string, string>> = {
  anthropic: {
    default: "claude-sonnet-4-20250514",
    "claude-sonnet": "claude-sonnet-4-20250514",
    "claude-opus": "claude-opus-4-20250514",
    "claude-haiku": "claude-3-5-haiku-20241022",
  },
  bedrock: {
    default: "us.anthropic.claude-sonnet-4-20250514-v1:0",
    "claude-sonnet": "us.anthropic.claude-sonnet-4-20250514-v1:0",
    "claude-opus": "us.anthropic.claude-opus-4-5-20251101-v1:0",
    "claude-haiku": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  },
  openai: {
    default: "gpt-4o",
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4-turbo",
    "o1": "o1",
    "o1-mini": "o1-mini",
  },
  google: {
    default: "gemini-2.0-flash",
    "gemini-flash": "gemini-2.0-flash",
    "gemini-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
  },
  openrouter: {
    default: "meta-llama/llama-3.3-70b-instruct:free",
    "gemini": "google/gemini-2.0-flash-exp:free",
    "llama": "meta-llama/llama-3.3-70b-instruct:free",
    "qwen": "qwen/qwen-2.5-72b-instruct:free",
  },
};

const MAX_TOKENS = 8192;

/**
 * Get provider configuration from environment variables.
 * Priority: GITGEN_PROVIDER > auto-detect from available keys
 */
export function getProviderConfig(): ProviderConfig {
  const explicitProvider = process.env.GITGEN_PROVIDER as ProviderType;
  const validProviders: ProviderType[] = ["anthropic", "bedrock", "openrouter", "openai", "google"];

  if (explicitProvider && validProviders.includes(explicitProvider)) {
    return { provider: explicitProvider };
  }

  // Auto-detect based on available environment variables
  if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_REGION) {
    return { provider: "bedrock" };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic" };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai" };
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { provider: "google" };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return { provider: "openrouter" };
  }

  throw new Error(
    "No provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, AWS credentials, or OPENROUTER_API_KEY."
  );
}

/**
 * Resolve model alias to full model ID for the given provider.
 */
export function resolveModel(modelAlias: string | undefined, provider: ProviderType): string {
  const mappings = MODEL_MAPPINGS[provider];
  if (!modelAlias) return mappings.default;
  return mappings[modelAlias] || modelAlias; // Allow direct model IDs
}

/**
 * Get the model instance for the configured provider.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModel(modelId: string, provider: ProviderType): any {
  switch (provider) {
    case "anthropic":
      return anthropic(modelId);
    case "bedrock":
      return bedrock(modelId);
    case "openai":
      return openai(modelId);
    case "google":
      return google(modelId);
    case "openrouter":
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      return openrouter(modelId);
  }
}

/**
 * Strip markdown code fences from content.
 */
function stripCodeFences(content: string): string {
  const fencePattern = /^```[\w]*\n([\s\S]*?)\n```$/;
  const match = content.trim().match(fencePattern);
  return match ? match[1] : content;
}

/**
 * Call the LLM with the given prompt and optional model alias.
 * Automatically detects and uses the configured provider.
 */
export async function llm(prompt: string, modelAlias?: string): Promise<string> {
  const config = getProviderConfig();
  const modelId = resolveModel(modelAlias || process.env.GITGEN_MODEL, config.provider);
  const model = getModel(modelId, config.provider);

  const result = await generateText({
    model,
    prompt,
    maxTokens: MAX_TOKENS,
  });

  return stripCodeFences(result.text);
}

/**
 * Call the LLM and return full result including usage stats.
 */
export async function llmWithUsage(prompt: string, modelAlias?: string): Promise<LLMResult> {
  const config = getProviderConfig();
  const modelId = resolveModel(modelAlias || process.env.GITGEN_MODEL, config.provider);
  const model = getModel(modelId, config.provider);

  const result = await generateText({
    model,
    prompt,
    maxTokens: MAX_TOKENS,
  });

  return {
    text: stripCodeFences(result.text),
    usage: result.usage
      ? {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        }
      : undefined,
  };
}

/**
 * Get a human-readable description of the current provider.
 */
export function getProviderDescription(): string {
  try {
    const config = getProviderConfig();
    const modelId = resolveModel(process.env.GITGEN_MODEL, config.provider);
    return `${config.provider} (${modelId})`;
  } catch {
    return "not configured";
  }
}
