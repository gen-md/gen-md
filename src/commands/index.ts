/**
 * CLI Commands Index
 */

export { initCommand, type InitOptions, type InitResult, formatInitResult } from "./init.js";
export { statusCommand, type StatusOptions, formatStatus } from "./status.js";
export { diffCommand, type DiffOptions, type DiffResult, formatDiff } from "./diff.js";
export { addCommand, type AddOptions, formatAddResult } from "./add.js";
export { commitCommand, type CommitOptions, formatCommitResult } from "./commit.js";
