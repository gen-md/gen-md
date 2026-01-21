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

// ============================================
// Git Context Types
// ============================================

/**
 * Represents a single git commit
 */
export interface GitCommit {
  /** Commit SHA (short or full) */
  hash: string;

  /** Commit message (first line) */
  subject: string;

  /** Full commit message body */
  body: string;

  /** Author name */
  author: string;

  /** Author email */
  authorEmail: string;

  /** Commit timestamp */
  date: Date;

  /** Files changed in this commit */
  files: string[];
}

/**
 * Git context for prompt enrichment
 */
export interface GitContext {
  /** Recent commits affecting the output file */
  commits: GitCommit[];

  /** Current branch name */
  branch: string;

  /** Repository root path */
  repoRoot: string;

  /** Remote URL (for GitHub integration) */
  remoteUrl: string | null;
}

/**
 * Options for git context extraction
 */
export interface GitContextOptions {
  /** Maximum number of commits to fetch */
  maxCommits?: number;

  /** Only commits affecting specific files */
  filterPaths?: string[];
}

// ============================================
// GitHub/PR Types
// ============================================

/**
 * GitHub authentication configuration
 */
export interface GitHubAuth {
  /** GitHub personal access token */
  token: string;

  /** Token source for logging/debugging */
  source: "env" | "gh-cli";
}

/**
 * Represents a GitHub Pull Request
 */
export interface GitHubPR {
  /** PR number */
  number: number;

  /** PR title */
  title: string;

  /** PR description/body */
  body: string;

  /** PR state */
  state: "open" | "closed" | "merged";

  /** Base branch */
  base: string;

  /** Head branch */
  head: string;

  /** PR author */
  author: string;

  /** Merge timestamp (if merged) */
  mergedAt: Date | null;

  /** Files changed in the PR */
  files: GitHubPRFile[];

  /** PR URL */
  url: string;
}

/**
 * File changed in a PR
 */
export interface GitHubPRFile {
  /** File path */
  path: string;

  /** Change type */
  status: "added" | "modified" | "removed" | "renamed";

  /** Lines added */
  additions: number;

  /** Lines removed */
  deletions: number;

  /** Patch content */
  patch: string | null;
}

/**
 * PR-based one-shot example (extends OneShotExample)
 */
export interface PRExample extends OneShotExample {
  /** Source PR number */
  prNumber: number;

  /** PR title (used as example label) */
  prTitle: string;

  /** PR URL for reference */
  prUrl: string;

  /** When the PR was merged */
  mergedAt: Date;
}

// ============================================
// Generated PR Output Types
// ============================================

/**
 * Options for PR generation
 */
export interface PRGenerationOptions {
  /** PR title (or generate from changes) */
  title?: string;

  /** Base branch for PR */
  base?: string;

  /** Labels to apply */
  labels?: string[];

  /** Draft PR */
  draft?: boolean;
}

/**
 * Generated PR output structure
 */
export interface GeneratedPR {
  /** PR title */
  title: string;

  /** PR description/body (markdown) */
  body: string;

  /** Base branch */
  base: string;

  /** Head branch (to be created) */
  head: string;

  /** Files to be changed */
  files: GeneratedPRFile[];

  /** Labels to apply */
  labels: string[];

  /** Source .gen.md file path */
  sourcePath: string;
}

/**
 * File to be created/modified in a PR
 */
export interface GeneratedPRFile {
  /** File path */
  path: string;

  /** File content */
  content: string;

  /** Action */
  action: "create" | "update" | "delete";
}

// ============================================
// Enhanced Prompt Types
// ============================================

/**
 * Extended prompt options with git/PR support
 */
export interface EnhancedPromptOptions extends PromptOptions {
  /** Include git context */
  includeGit?: boolean;

  /** Git context options */
  gitOptions?: GitContextOptions;

  /** Include PR examples */
  includePRExamples?: boolean;

  /** Maximum PR examples to include */
  maxPRExamples?: number;
}

/**
 * Enhanced generated prompt with git/PR context
 */
export interface EnhancedGeneratedPrompt extends GeneratedPrompt {
  /** Git context (if requested) */
  gitContext: GitContext | null;

  /** PR examples used (if requested) */
  prExamples: PRExample[];
}
