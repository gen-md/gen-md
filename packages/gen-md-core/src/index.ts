// Types
export type {
  OneShotExample,
  GenMdFile,
  GenMdFrontmatter,
  ResolvedGenMdConfig,
  ArrayMergeStrategy,
  BodyMergeStrategy,
  CascadeOptions,
  CompactOptions,
  PromptOptions,
  GeneratedPrompt,
  // Git types
  GitCommit,
  GitContext,
  GitContextOptions,
  // GitHub/PR types
  GitHubAuth,
  GitHubPR,
  GitHubPRFile,
  PRExample,
  PRGenerationOptions,
  GeneratedPR,
  GeneratedPRFile,
  // Enhanced prompt types
  EnhancedPromptOptions,
  EnhancedGeneratedPrompt,
} from "./types/index.js";

// Parser
export { GenMdParser, parser } from "./parser/index.js";

// Cascading Resolver
export { CascadingResolver, createResolver } from "./resolver/index.js";

// Compactor
export {
  Compactor,
  GenMdSerializer,
  createCompactor,
  createSerializer,
} from "./compactor/index.js";

// Validator
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidateOptions,
} from "./validator/index.js";

export {
  Validator,
  createValidator,
  formatValidationResults,
} from "./validator/index.js";

// Prompt Generator
export { PromptGenerator, createPromptGenerator } from "./prompt/index.js";

// Git Context
export {
  GitContextExtractor,
  createGitExtractor,
  formatGitContextForPrompt,
} from "./git/index.js";

// GitHub Integration
export {
  GitHubClient,
  createGitHubClient,
  resolveGitHubAuth,
  parseGitHubRepo,
} from "./github/index.js";

// PR Generator
export {
  PRGenerator,
  createPRGenerator,
  formatPRForGhCli,
} from "./pr/index.js";

// Utilities
export { mergeArrays, mergeBody, deduplicateArray } from "./utils/merge.js";
