/**
 * Config Command
 *
 * Manage gitgen configuration (provider, model, etc.)
 */

import chalk from "chalk";
import { GenMdStore } from "../core/store.js";
import { providers } from "../providers/index.js";
import type { GenMdConfig } from "../types.js";

/**
 * Config command options
 */
export interface ConfigCommandOptions {
  action: "get" | "set" | "list" | "unset";
  key?: string;
  value?: string;
  path?: string;
}

/**
 * Config command result
 */
export interface ConfigCommandResult {
  success: boolean;
  key?: string;
  value?: string | null;
  config?: GenMdConfig;
}

/**
 * Execute the config command
 */
export async function configCommand(options: ConfigCommandOptions): Promise<ConfigCommandResult> {
  const store = new GenMdStore(options.path || process.cwd());

  switch (options.action) {
    case "get":
      return handleGet(store, options.key);

    case "set":
      return handleSet(store, options.key, options.value);

    case "unset":
      return handleUnset(store, options.key);

    case "list":
      return handleList(store);

    default:
      throw new Error(`Unknown action: ${options.action}`);
  }
}

/**
 * Get a config value
 */
async function handleGet(store: GenMdStore, key?: string): Promise<ConfigCommandResult> {
  if (!key) {
    throw new Error("Key is required for 'get'");
  }

  const config = await store.getConfig();
  const value = getNestedValue(config as unknown as Record<string, unknown>, key);

  return {
    success: true,
    key,
    value: value !== undefined ? String(value) : null,
  };
}

/**
 * Set a config value
 */
async function handleSet(store: GenMdStore, key?: string, value?: string): Promise<ConfigCommandResult> {
  if (!key) {
    throw new Error("Key is required for 'set'");
  }
  if (value === undefined) {
    throw new Error("Value is required for 'set'");
  }

  const config = await store.getConfig();
  setNestedValue(config as unknown as Record<string, unknown>, key, value);
  await store.setConfig(config);

  return {
    success: true,
    key,
    value,
  };
}

/**
 * Unset a config value
 */
async function handleUnset(store: GenMdStore, key?: string): Promise<ConfigCommandResult> {
  if (!key) {
    throw new Error("Key is required for 'unset'");
  }

  const config = await store.getConfig();
  deleteNestedValue(config as unknown as Record<string, unknown>, key);
  await store.setConfig(config);

  return {
    success: true,
    key,
    value: null,
  };
}

/**
 * List all config values
 */
async function handleList(store: GenMdStore): Promise<ConfigCommandResult> {
  const config = await store.getConfig();

  return {
    success: true,
    config,
  };
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Set a nested value in an object using dot notation
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];

  // Try to parse as JSON for complex values
  try {
    current[lastPart] = JSON.parse(value);
  } catch {
    current[lastPart] = value;
  }
}

/**
 * Delete a nested value from an object using dot notation
 */
function deleteNestedValue(obj: Record<string, unknown>, path: string): void {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      return;
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  delete current[lastPart];
}

/**
 * Format config for display
 */
export function formatConfig(result: ConfigCommandResult): string {
  if (result.key && result.value !== undefined) {
    if (result.value === null) {
      return chalk.dim(`${result.key} is not set`);
    }
    return `${result.key}=${result.value}`;
  }

  if (result.config) {
    const lines: string[] = [];
    formatConfigObject(result.config as unknown as Record<string, unknown>, "", lines);
    return lines.join("\n") || chalk.dim("No configuration set");
  }

  return "";
}

/**
 * Recursively format a config object
 */
function formatConfigObject(obj: Record<string, unknown>, prefix: string, lines: string[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      formatConfigObject(value as Record<string, unknown>, fullKey, lines);
    } else {
      const displayValue = typeof value === "string" ? value : JSON.stringify(value);
      lines.push(`${fullKey}=${displayValue}`);
    }
  }
}

/**
 * Provider command - list/add providers
 */
export interface ProviderCommandOptions {
  action: "list" | "models";
  provider?: string;
}

export interface ProviderCommandResult {
  providers?: Array<{
    name: string;
    configured: boolean;
    models: string[];
  }>;
  models?: string[];
}

export async function providerCommand(options: ProviderCommandOptions): Promise<ProviderCommandResult> {
  switch (options.action) {
    case "list":
      return {
        providers: providers.list().map((p) => ({
          name: p.name,
          configured: p.isConfigured(),
          models: p.models(),
        })),
      };

    case "models":
      if (!options.provider) {
        throw new Error("Provider name required for 'models'");
      }
      const provider = providers.get(options.provider);
      if (!provider) {
        throw new Error(`Provider "${options.provider}" not found`);
      }
      return {
        models: provider.models(),
      };

    default:
      throw new Error(`Unknown action: ${options.action}`);
  }
}

/**
 * Format provider list for display
 */
export function formatProviders(result: ProviderCommandResult): string {
  if (result.providers) {
    const lines = result.providers.map((p) => {
      const status = p.configured ? chalk.green("✓") : chalk.dim("○");
      const models = chalk.dim(`(${p.models.slice(0, 3).join(", ")}${p.models.length > 3 ? "..." : ""})`);
      return `${status} ${p.name.padEnd(12)} ${models}`;
    });

    return [
      chalk.cyan("Available Providers"),
      "",
      ...lines,
      "",
      chalk.dim("✓ = configured, ○ = needs API key"),
    ].join("\n");
  }

  if (result.models) {
    return result.models.join("\n");
  }

  return "";
}
