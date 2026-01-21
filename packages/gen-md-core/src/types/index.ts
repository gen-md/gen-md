/**
 * A one-shot example for conversational prompts
 */
export interface OneShotExample {
  /** Example input/specification */
  input: string;

  /** Example output/result */
  output: string;
}

/**
 * Represents a parsed .gen.md file
 */
export interface GenMdFile {
  /** Absolute path to the .gen.md file */
  filePath: string;

  /** Parsed frontmatter configuration */
  frontmatter: GenMdFrontmatter;

  /** Markdown body content (everything after frontmatter, excluding examples) */
  body: string;

  /** One-shot examples parsed from <example> blocks */
  examples: OneShotExample[];

  /** Original raw content of the file */
  raw: string;
}

/**
 * YAML frontmatter schema for .gen.md files
 */
export interface GenMdFrontmatter {
  /** Human-readable identifier */
  name?: string;

  /** Description of what gets generated */
  description?: string;

  /** Array of file paths to include as context */
  context?: string[];

  /** Array of skill references (by name or path) */
  skills?: string[];

  /** Variable placeholder for dynamic input */
  prompt?: string;

  /** Target output filename */
  output?: string;

  /** Allow extension properties */
  [key: string]: unknown;
}

/**
 * Represents a resolved (cascaded) configuration
 */
export interface ResolvedGenMdConfig {
  /** All .gen.md files in the cascade chain, root to leaf */
  chain: GenMdFile[];

  /** Merged frontmatter from all cascade levels */
  frontmatter: GenMdFrontmatter;

  /** Merged body content */
  body: string;

  /** Absolute paths to all resolved context files */
  resolvedContext: string[];

  /** Absolute paths to all resolved skill files */
  resolvedSkills: string[];
}

/**
 * Strategy for merging arrays during cascade/compaction
 */
export type ArrayMergeStrategy =
  | "concatenate" // Append child arrays to parent
  | "prepend" // Prepend child arrays to parent
  | "replace" // Child completely replaces parent
  | "dedupe" // Concatenate and remove duplicates
  | "dedupe-last"; // Dedupe keeping last occurrence

/**
 * Strategy for merging body content
 */
export type BodyMergeStrategy =
  | "append" // Append child body after parent
  | "prepend" // Prepend child body before parent
  | "replace"; // Child body replaces parent

/**
 * Options for cascade resolution
 */
export interface CascadeOptions {
  /** Strategy for merging context arrays */
  contextMerge?: ArrayMergeStrategy;

  /** Strategy for merging skills arrays */
  skillsMerge?: ArrayMergeStrategy;

  /** Strategy for merging body content */
  bodyMerge?: BodyMergeStrategy;

  /** Stop directory (don't cascade above this) */
  stopAt?: string;

  /** Maximum cascade depth */
  maxDepth?: number;
}

/**
 * Options for compaction
 */
export interface CompactOptions {
  /** Strategy for merging arrays */
  arrayMerge?: ArrayMergeStrategy;

  /** Strategy for merging body content */
  bodyMerge?: BodyMergeStrategy;

  /** Output file path */
  output?: string;

  /** Whether to resolve relative paths to absolute */
  resolvePaths?: boolean;

  /** Base directory for path resolution */
  basePath?: string;
}

/**
 * Options for prompt generation
 */
export interface PromptOptions {
  /** Strategy for merging examples during cascade */
  examplesMerge?: ArrayMergeStrategy;

  /** Whether to include current output file content as an example */
  includeCurrentOutput?: boolean;

  /** Override user prompt (instead of body content) */
  userPrompt?: string;
}

/**
 * Result of generating a conversational prompt
 */
export interface GeneratedPrompt {
  /** The fully rendered conversational prompt string */
  prompt: string;

  /** All one-shot examples included */
  examples: OneShotExample[];

  /** The body content (user prompt) */
  body: string;

  /** Current output file content (if exists and included) */
  currentCode: string | null;

  /** Source .gen.md file path */
  sourcePath: string;
}
