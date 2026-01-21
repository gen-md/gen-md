/**
 * Prompt Loader
 *
 * Loads prompt templates from markdown files, supporting both
 * built-in prompts and user-defined overrides.
 */

import { readFile, access, constants } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Prompt template names
 */
export type PromptName =
  | "system"
  | "spec-section"
  | "context-section"
  | "skills-section"
  | "existing-content-section"
  | "examples-section"
  | "instructions-section"
  | "final-instruction";

/**
 * Default prompts directory (relative to dist/core/)
 */
const DEFAULT_PROMPTS_DIR = join(__dirname, "../../prompts");

/**
 * Cache for loaded prompts
 */
const promptCache = new Map<string, string>();

/**
 * Custom prompts directory override
 */
let customPromptsDir: string | null = null;

/**
 * Set a custom prompts directory
 */
export function setPromptsDir(dir: string): void {
  customPromptsDir = dir;
  promptCache.clear();
}

/**
 * Get the current prompts directory
 */
export function getPromptsDir(): string {
  return customPromptsDir ?? DEFAULT_PROMPTS_DIR;
}

/**
 * Reset to default prompts directory
 */
export function resetPromptsDir(): void {
  customPromptsDir = null;
  promptCache.clear();
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load a prompt template by name
 *
 * Resolution order:
 * 1. Custom prompts directory (if set)
 * 2. Project-local .gen-md/prompts/ directory
 * 3. Built-in prompts directory
 */
export async function loadPrompt(
  name: PromptName,
  cwd: string = process.cwd()
): Promise<string> {
  // Check cache first
  const cacheKey = `${cwd}:${name}`;
  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  const filename = `${name}.md`;

  // Try custom directory first
  if (customPromptsDir) {
    const customPath = join(customPromptsDir, filename);
    if (await fileExists(customPath)) {
      const content = await readFile(customPath, "utf-8");
      promptCache.set(cacheKey, content);
      return content;
    }
  }

  // Try project-local .gen-md/prompts/
  const localPath = join(cwd, ".gen-md", "prompts", filename);
  if (await fileExists(localPath)) {
    const content = await readFile(localPath, "utf-8");
    promptCache.set(cacheKey, content);
    return content;
  }

  // Fall back to built-in prompts
  const builtinPath = join(DEFAULT_PROMPTS_DIR, filename);
  if (await fileExists(builtinPath)) {
    const content = await readFile(builtinPath, "utf-8");
    promptCache.set(cacheKey, content);
    return content;
  }

  throw new Error(`Prompt template not found: ${name}`);
}

/**
 * Load all prompt templates
 */
export async function loadAllPrompts(
  cwd: string = process.cwd()
): Promise<Map<PromptName, string>> {
  const prompts = new Map<PromptName, string>();
  const names: PromptName[] = [
    "system",
    "spec-section",
    "context-section",
    "skills-section",
    "existing-content-section",
    "examples-section",
    "instructions-section",
    "final-instruction",
  ];

  for (const name of names) {
    prompts.set(name, await loadPrompt(name, cwd));
  }

  return prompts;
}

/**
 * Skill information loaded from a skill file
 */
export interface LoadedSkill {
  name: string;
  content: string;
  path: string;
}

/**
 * Load skills from file paths
 * Skills are markdown files that provide domain-specific knowledge
 */
export async function loadSkills(skillPaths: string[]): Promise<LoadedSkill[]> {
  const skills: LoadedSkill[] = [];

  for (const skillPath of skillPaths) {
    try {
      const content = await readFile(skillPath, "utf-8");
      // Extract name from first H1 heading or use filename
      const nameMatch = content.match(/^#\s+(.+)$/m);
      const name = nameMatch ? nameMatch[1] : skillPath.split("/").pop()?.replace(/\.(md|txt)$/, "") || "Unknown Skill";

      skills.push({
        name,
        content,
        path: skillPath,
      });
    } catch {
      // Skip skills that can't be read
    }
  }

  return skills;
}

/**
 * Clear the prompt cache
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

/**
 * Simple template interpolation
 *
 * Supports:
 * - {{variable}} - Simple variable replacement
 * - {{#if variable}}...{{/if}} - Conditional blocks
 * - {{#each items}}...{{/each}} - Iteration (uses {{path}}, {{content}}, etc. within)
 */
export function interpolate(
  template: string,
  context: Record<string, unknown>
): string {
  let result = template;

  // Process {{#each items}}...{{/each}} blocks
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, arrayName, content) => {
      const array = context[arrayName];
      if (!Array.isArray(array) || array.length === 0) {
        return "";
      }
      return array
        .map((item) => {
          let itemContent = content;
          if (typeof item === "object" && item !== null) {
            for (const [key, value] of Object.entries(item)) {
              itemContent = itemContent.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                String(value ?? "")
              );
            }
          }
          return itemContent;
        })
        .join("");
    }
  );

  // Process {{#if variable}}...{{/if}} blocks
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => {
      const value = context[varName];
      return value ? content : "";
    }
  );

  // Process simple {{variable}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    const value = context[varName];
    return value !== undefined && value !== null ? String(value) : "";
  });

  return result;
}
