import { anthropic } from "@ai-sdk/anthropic";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

export type ProviderType = "anthropic" | "bedrock" | "openrouter";

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
    default: "anthropic.claude-sonnet-4-20250514-v1:0",
    "claude-sonnet": "anthropic.claude-sonnet-4-20250514-v1:0",
    "claude-opus": "anthropic.claude-opus-4-20250514-v1:0",
    "claude-haiku": "anthropic.claude-3-5-haiku-20241022-v1:0",
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

  if (explicitProvider && ["anthropic", "bedrock", "openrouter"].includes(explicitProvider)) {
    return { provider: explicitProvider };
  }

  // Auto-detect based on available environment variables
  if (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_REGION) {
    return { provider: "bedrock" };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return { provider: "openrouter" };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: "anthropic" };
  }

  throw new Error(
    "No provider configured. Set ANTHROPIC_API_KEY, AWS credentials, or OPENROUTER_API_KEY."
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
function getModel(modelId: string, provider: ProviderType) {
  switch (provider) {
    case "anthropic":
      return anthropic(modelId);
    case "bedrock":
      return bedrock(modelId);
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
