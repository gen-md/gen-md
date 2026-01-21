/**
 * Extensions System
 *
 * Provides extensibility points for gitgen:
 * - Custom LLM providers
 * - Custom prompt sections
 * - Pre/post processing hooks
 */

import type { PredictionContext, PredictedContent } from "../types.js";

/**
 * LLM Provider interface
 */
export interface LLMProvider {
  /** Provider name */
  name: string;

  /** Generate content from a prompt */
  generate(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
}

/**
 * LLM generation options
 */
export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

/**
 * LLM response
 */
export interface LLMResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Prompt section builder interface
 */
export interface PromptSection {
  /** Section name (used for ordering) */
  name: string;

  /** Priority (higher = earlier in prompt) */
  priority: number;

  /** Build the section content */
  build(context: PredictionContext): Promise<string>;

  /** Whether this section should be included */
  shouldInclude?(context: PredictionContext): boolean;
}

/**
 * Hook types
 */
export type PrePredictHook = (
  context: PredictionContext
) => Promise<PredictionContext>;

export type PostPredictHook = (
  result: PredictedContent,
  context: PredictionContext
) => Promise<PredictedContent>;

export type PromptBuiltHook = (
  prompt: string,
  context: PredictionContext
) => Promise<string>;

/**
 * Extension registry
 */
class ExtensionRegistry {
  private providers: Map<string, LLMProvider> = new Map();
  private sections: Map<string, PromptSection> = new Map();
  private prePredictHooks: PrePredictHook[] = [];
  private postPredictHooks: PostPredictHook[] = [];
  private promptBuiltHooks: PromptBuiltHook[] = [];
  private defaultProvider: string | null = null;

  /**
   * Register an LLM provider
   */
  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = provider.name;
    }
  }

  /**
   * Get an LLM provider by name
   */
  getProvider(name?: string): LLMProvider | undefined {
    const providerName = name ?? this.defaultProvider;
    return providerName ? this.providers.get(providerName) : undefined;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider not registered: ${name}`);
    }
    this.defaultProvider = name;
  }

  /**
   * List registered providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Register a custom prompt section
   */
  registerSection(section: PromptSection): void {
    this.sections.set(section.name, section);
  }

  /**
   * Get all registered sections sorted by priority
   */
  getSections(): PromptSection[] {
    return Array.from(this.sections.values()).sort(
      (a, b) => b.priority - a.priority
    );
  }

  /**
   * Remove a section by name
   */
  removeSection(name: string): boolean {
    return this.sections.delete(name);
  }

  /**
   * Register a pre-predict hook
   */
  onPrePredict(hook: PrePredictHook): void {
    this.prePredictHooks.push(hook);
  }

  /**
   * Register a post-predict hook
   */
  onPostPredict(hook: PostPredictHook): void {
    this.postPredictHooks.push(hook);
  }

  /**
   * Register a prompt-built hook
   */
  onPromptBuilt(hook: PromptBuiltHook): void {
    this.promptBuiltHooks.push(hook);
  }

  /**
   * Run pre-predict hooks
   */
  async runPrePredictHooks(
    context: PredictionContext
  ): Promise<PredictionContext> {
    let result = context;
    for (const hook of this.prePredictHooks) {
      result = await hook(result);
    }
    return result;
  }

  /**
   * Run post-predict hooks
   */
  async runPostPredictHooks(
    result: PredictedContent,
    context: PredictionContext
  ): Promise<PredictedContent> {
    let current = result;
    for (const hook of this.postPredictHooks) {
      current = await hook(current, context);
    }
    return current;
  }

  /**
   * Run prompt-built hooks
   */
  async runPromptBuiltHooks(
    prompt: string,
    context: PredictionContext
  ): Promise<string> {
    let result = prompt;
    for (const hook of this.promptBuiltHooks) {
      result = await hook(result, context);
    }
    return result;
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.providers.clear();
    this.sections.clear();
    this.prePredictHooks = [];
    this.postPredictHooks = [];
    this.promptBuiltHooks = [];
    this.defaultProvider = null;
  }
}

/**
 * Global extension registry
 */
export const extensions = new ExtensionRegistry();

/**
 * Extension definition for easy registration
 */
export interface Extension {
  name: string;
  version: string;
  description?: string;

  /** Called when extension is loaded */
  activate?(registry: ExtensionRegistry): void | Promise<void>;

  /** Called when extension is unloaded */
  deactivate?(): void | Promise<void>;
}

/**
 * Load an extension
 */
export async function loadExtension(extension: Extension): Promise<void> {
  if (extension.activate) {
    await extension.activate(extensions);
  }
}

/**
 * Create a simple prompt section
 */
export function createSection(
  name: string,
  priority: number,
  builder: (context: PredictionContext) => Promise<string> | string,
  shouldInclude?: (context: PredictionContext) => boolean
): PromptSection {
  return {
    name,
    priority,
    async build(context: PredictionContext) {
      return builder(context);
    },
    shouldInclude,
  };
}
