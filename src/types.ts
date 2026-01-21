/**
 * GitGen Type Definitions
 * Git-like MCP for predictive version control using .gitgen.md specs
 */

// ============================================================================
// .gitgen.md File Types
// ============================================================================

/**
 * YAML frontmatter fields in a .gitgen.md file
 */
export interface GenMdFrontmatter {
  name?: string;
  description?: string;
  context?: string[];
  skills?: string[];
  output?: string;
  prompt?: string;
  [key: string]: unknown;
}

/**
 * Parsed .gitgen.md file
 */
export interface GenMdFile {
  /** Absolute path to the file */
  filePath: string;
  /** Parsed YAML frontmatter */
  frontmatter: GenMdFrontmatter;
  /** Markdown body content (the prompt/instructions) */
  body: string;
  /** One-shot examples extracted from <example> blocks */
  examples: OneShotExample[];
  /** Raw file content */
  raw: string;
}

/**
 * One-shot example extracted from <example> blocks
 */
export interface OneShotExample {
  input: string;
  output: string;
}

/**
 * Resolved configuration after cascade chain merge
 */
export interface ResolvedGenMdConfig {
  /** The leaf file path */
  filePath: string;
  /** Merged frontmatter from cascade chain */
  frontmatter: GenMdFrontmatter;
  /** Merged body from cascade chain */
  body: string;
  /** All examples from cascade chain */
  examples: OneShotExample[];
  /** The cascade chain (root to leaf) */
  chain: GenMdFile[];
}

// ============================================================================
// Store Types (.gitgen directory)
// ============================================================================

/**
 * Staged spec entry in the index
 */
export interface StagedSpec {
  /** Path to the .gitgen.md file */
  specPath: string;
  /** Hash of the spec content when staged */
  specHash: string;
  /** Path to the output file */
  outputPath: string;
  /** Hash of predicted content (if generated) */
  predictedHash?: string;
  /** Timestamp when staged */
  stagedAt: Date;
}

/**
 * Index file structure (like git index)
 */
export interface GenMdIndex {
  /** Currently staged specs */
  staged: StagedSpec[];
  /** Last commit hash */
  lastCommit?: string;
}

/**
 * Log entry for generation history
 */
export interface LogEntry {
  /** Commit hash */
  hash: string;
  /** Generation message */
  message: string;
  /** Spec path that was generated */
  specPath: string;
  /** Output path */
  outputPath: string;
  /** Hash of generated content */
  contentHash: string;
  /** Timestamp */
  timestamp: Date;
  /** Model used for prediction */
  model: string;
  /** Token usage */
  tokens: {
    input: number;
    output: number;
  };
}

/**
 * Configuration in .gitgen/config.json
 */
export interface GenMdConfig {
  /** Default provider to use */
  provider?: string;
  /** Default model to use */
  model?: string;
  /** Default branch */
  defaultBranch?: string;
  /** Provider configurations */
  providers?: Record<string, ProviderConfig>;
}

// ============================================================================
// Git Context Types
// ============================================================================

/**
 * Git commit information
 */
export interface GitCommit {
  hash: string;
  subject: string;
  body: string;
  author: string;
  authorEmail: string;
  date: Date;
  files: string[];
}

/**
 * Git repository context
 */
export interface GitContext {
  /** Repository root directory */
  repoRoot: string;
  /** Current branch name */
  branch: string;
  /** Remote URL (typically GitHub) */
  remoteUrl: string | null;
  /** Recent commits */
  commits: GitCommit[];
}

/**
 * Options for git context extraction
 */
export interface GitContextOptions {
  /** Maximum number of commits to include */
  maxCommits?: number;
  /** Filter commits to those affecting these paths */
  filterPaths?: string[];
}

// ============================================================================
// Prediction Types
// ============================================================================

/**
 * Context for content prediction
 */
export interface PredictionContext {
  /** Resolved cascade configuration */
  config: ResolvedGenMdConfig;
  /** Git repository context */
  gitContext: GitContext | null;
  /** Current content of output file (if exists) */
  existingContent: string | null;
  /** Contents of referenced context files */
  referencedFiles: Map<string, string>;
}

/**
 * Result of content prediction
 */
export interface PredictedContent {
  /** The generated content */
  content: string;
  /** SHA-256 hash of content */
  hash: string;
  /** Model used for generation */
  model: string;
  /** Input token count */
  inputTokens: number;
  /** Output token count */
  outputTokens: number;
}

/**
 * Options for predictor
 */
export interface PredictorOptions {
  /** Model to use (default: claude-sonnet-4-20250514) */
  model?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
}

// ============================================================================
// Diff Types
// ============================================================================

/**
 * Diff hunk
 */
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

/**
 * File diff result
 */
export interface FileDiff {
  /** Path to the file */
  path: string;
  /** Original content (empty if new file) */
  oldContent: string;
  /** New content */
  newContent: string;
  /** Diff hunks */
  hunks: DiffHunk[];
  /** Whether file is new */
  isNew: boolean;
  /** Whether file is deleted */
  isDeleted: boolean;
}

// ============================================================================
// Status Types
// ============================================================================

/**
 * Spec status
 */
export type SpecStatus =
  | "up-to-date" // Output matches predicted
  | "modified" // Spec changed, needs regeneration
  | "missing" // Output file doesn't exist
  | "untracked" // New spec, not yet staged
  | "staged"; // Staged for commit

/**
 * Status entry for a single spec
 */
export interface SpecStatusEntry {
  /** Path to the .gitgen.md file */
  specPath: string;
  /** Path to the output file */
  outputPath: string;
  /** Current status */
  status: SpecStatus;
  /** Spec file last modified */
  specModified: Date;
  /** Output file last modified (if exists) */
  outputModified?: Date;
}

/**
 * Overall status result
 */
export interface StatusResult {
  /** Current branch */
  branch: string;
  /** All spec entries */
  specs: SpecStatusEntry[];
  /** Staged specs count */
  stagedCount: number;
  /** Modified specs count */
  modifiedCount: number;
  /** Untracked specs count */
  untrackedCount: number;
}

// ============================================================================
// Command Result Types
// ============================================================================

/**
 * Result of add command
 */
export interface AddResult {
  /** Path to created/staged spec */
  specPath: string;
  /** Whether a new spec was created */
  created: boolean;
  /** Whether spec was staged */
  staged: boolean;
}

/**
 * Result of commit command
 */
export interface CommitResult {
  /** Commit hash */
  hash: string;
  /** Message */
  message: string;
  /** Files generated */
  files: Array<{
    specPath: string;
    outputPath: string;
    contentHash: string;
  }>;
  /** Total tokens used */
  totalTokens: {
    input: number;
    output: number;
  };
}

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Options for LLM generation
 */
export interface GenerateOptions {
  /** Model to use */
  model: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
  /** System prompt */
  systemPrompt?: string;
}

/**
 * Result of LLM generation
 */
export interface GenerateResult {
  /** Generated content */
  content: string;
  /** Model used */
  model: string;
  /** Input token count */
  inputTokens: number;
  /** Output token count */
  outputTokens: number;
  /** Finish reason */
  finishReason: string;
}

/**
 * LLM Provider interface
 */
export interface LLMProvider {
  /** Provider name */
  name: string;
  /** Generate content */
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResult>;
  /** Stream content (optional) */
  stream?(prompt: string, options: GenerateOptions): AsyncIterable<string>;
  /** Get available models */
  models(): string[];
  /** Check if provider is configured */
  isConfigured(): boolean;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider name */
  name: string;
  /** API key (if applicable) */
  apiKey?: string;
  /** Base URL (for custom endpoints) */
  baseUrl?: string;
  /** Default model */
  defaultModel?: string;
  /** Additional options */
  options?: Record<string, unknown>;
}

// ============================================================================
// Refine Session Types
// ============================================================================

/**
 * Entry in refinement history
 */
export interface RefineEntry {
  /** Generated content */
  content: string;
  /** Content hash */
  hash: string;
  /** Timestamp */
  timestamp: Date;
  /** User feedback that led to this version */
  feedback?: string;
  /** Model used */
  model: string;
  /** Provider used */
  provider: string;
  /** Token usage */
  tokens: {
    input: number;
    output: number;
  };
}

/**
 * Refinement session state
 */
export interface RefineSession {
  /** Path to the spec file */
  specPath: string;
  /** Current content version */
  currentContent: string;
  /** Refinement history */
  history: RefineEntry[];
  /** Accumulated feedback */
  feedback: string[];
  /** Session start time */
  startedAt: Date;
}
