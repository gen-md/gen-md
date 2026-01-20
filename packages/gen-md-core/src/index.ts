// Types
export type {
  GenMdFile,
  GenMdFrontmatter,
  ResolvedGenMdConfig,
  ArrayMergeStrategy,
  BodyMergeStrategy,
  CascadeOptions,
  CompactOptions,
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

// Utilities
export { mergeArrays, mergeBody, deduplicateArray } from "./utils/merge.js";
