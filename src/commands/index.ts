/**
 * CLI Commands Index
 */

export { initCommand, type InitOptions, type InitResult, formatInitResult } from "./init.js";
export { statusCommand, type StatusOptions, formatStatus } from "./status.js";
export { diffCommand, type DiffOptions, type DiffResult, formatDiff } from "./diff.js";
export { addCommand, type AddOptions, formatAddResult } from "./add.js";
export { commitCommand, type CommitOptions, formatCommitResult } from "./commit.js";
export { watchCommand, type WatchOptions } from "./watch.js";
export { cascadeCommand, type CascadeOptions, type CascadeResult, formatCascade } from "./cascade.js";
export { validateCommand, type ValidateOptions, type ValidateResult, formatValidate } from "./validate.js";
