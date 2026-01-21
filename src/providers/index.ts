/**
 * Provider Registry
 *
 * Manages LLM providers for content generation.
 * Supports Anthropic, OpenAI, Ollama, and custom providers.
 */

import type { LLMProvider, GenerateOptions, GenerateResult, ProviderConfig } from "../types.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { OllamaProvider } from "./ollama.js";

/**
 * Provider registry - singleton that manages all providers
 */
class ProviderRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string = "anthropic";

  constructor() {
    // Register built-in providers
    this.register(new AnthropicProvider());
    this.register(new OpenAIProvider());
    this.register(new OllamaProvider());
  }

  /**
   * Register a provider
   */
  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  get(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  list(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get configured providers (providers that have API keys set)
   */
  listConfigured(): LLMProvider[] {
    return this.list().filter((p) => p.isConfigured());
  }

  /**
   * Set the default provider
   */
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" not found`);
    }
    this.defaultProvider = name;
  }

  /**
   * Get the default provider
   */
  getDefault(): LLMProvider {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider "${this.defaultProvider}" not found`);
    }
    return provider;
  }

  /**
   * Get default provider name
   */
  getDefaultName(): string {
    return this.defaultProvider;
  }

  /**
   * Generate content using specified or default provider
   */
  async generate(
    prompt: string,
    options: GenerateOptions & { provider?: string }
  ): Promise<GenerateResult> {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    if (!provider.isConfigured()) {
      throw new Error(
        `Provider "${providerName}" is not configured. ` +
          `Set ${getEnvVarName(providerName)} environment variable or run "gitgen config set ${providerName}.apiKey <key>"`
      );
    }

    return provider.generate(prompt, options);
  }

  /**
   * Stream content using specified or default provider
   */
  async *stream(
    prompt: string,
    options: GenerateOptions & { provider?: string }
  ): AsyncIterable<string> {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    if (!provider.stream) {
      throw new Error(`Provider "${providerName}" does not support streaming`);
    }

    if (!provider.isConfigured()) {
      throw new Error(
        `Provider "${providerName}" is not configured. ` +
          `Set ${getEnvVarName(providerName)} environment variable.`
      );
    }

    yield* provider.stream(prompt, options);
  }
}

/**
 * Get environment variable name for a provider
 */
function getEnvVarName(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "openai":
      return "OPENAI_API_KEY";
    case "azure":
      return "AZURE_OPENAI_API_KEY";
    default:
      return `${provider.toUpperCase()}_API_KEY`;
  }
}

// Global registry instance
export const providers = new ProviderRegistry();

// Re-export types and providers
export { AnthropicProvider } from "./anthropic.js";
export { OpenAIProvider } from "./openai.js";
export { OllamaProvider } from "./ollama.js";
export type { LLMProvider, GenerateOptions, GenerateResult, ProviderConfig };
