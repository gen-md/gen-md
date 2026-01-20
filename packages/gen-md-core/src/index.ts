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
