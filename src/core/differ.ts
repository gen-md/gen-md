/**
 * Diff Generator
 *
 * Generates diffs between current and predicted content.
 */

import { createTwoFilesPatch, structuredPatch } from "diff";
import type { DiffHunk, FileDiff } from "../types.js";

/**
 * Options for diff generation
 */
export interface DiffOptions {
  /** Number of context lines around changes */
  contextLines?: number;
}

const DEFAULT_CONTEXT_LINES = 3;

/**
 * Diff generator
 */
export class Differ {
  private options: Required<DiffOptions>;

  constructor(options: DiffOptions = {}) {
    this.options = {
      contextLines: options.contextLines ?? DEFAULT_CONTEXT_LINES,
    };
  }

  /**
   * Generate diff between old and new content
   */
  diff(
    path: string,
    oldContent: string,
    newContent: string
  ): FileDiff {
    const isNew = !oldContent;
    const isDeleted = !newContent;

    // Normalize content (ensure newline at end)
    const normalizedOld = oldContent ? this.normalizeContent(oldContent) : "";
    const normalizedNew = newContent ? this.normalizeContent(newContent) : "";

    // Generate structured patch
    const patch = structuredPatch(
      `a/${path}`,
      `b/${path}`,
      normalizedOld,
      normalizedNew,
      "current",
      "predicted",
      { context: this.options.contextLines }
    );

    // Convert hunks
    const hunks: DiffHunk[] = patch.hunks.map((h) => ({
      oldStart: h.oldStart,
      oldLines: h.oldLines,
      newStart: h.newStart,
      newLines: h.newLines,
      lines: h.lines,
    }));

    return {
      path,
      oldContent: normalizedOld,
      newContent: normalizedNew,
      hunks,
      isNew,
      isDeleted,
    };
  }

  /**
   * Format diff for display
   */
  formatDiff(diff: FileDiff): string {
    if (diff.hunks.length === 0) {
      return "No changes";
    }

    const lines: string[] = [];

    // Header
    if (diff.isNew) {
      lines.push(`diff --gen-md a/${diff.path} b/${diff.path}`);
      lines.push("new file");
    } else if (diff.isDeleted) {
      lines.push(`diff --gen-md a/${diff.path} b/${diff.path}`);
      lines.push("deleted file");
    } else {
      lines.push(`diff --gen-md a/${diff.path} b/${diff.path}`);
    }

    lines.push(`--- a/${diff.path} (current)`);
    lines.push(`+++ b/${diff.path} (predicted)`);

    // Hunks
    for (const hunk of diff.hunks) {
      lines.push(
        `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
      );
      lines.push(...hunk.lines);
    }

    return lines.join("\n");
  }

  /**
   * Format diff with ANSI colors
   */
  formatDiffColored(diff: FileDiff): string {
    if (diff.hunks.length === 0) {
      return "\x1b[90mNo changes\x1b[0m";
    }

    const lines: string[] = [];

    // Header (bold)
    if (diff.isNew) {
      lines.push(`\x1b[1mdiff --gen-md a/${diff.path} b/${diff.path}\x1b[0m`);
      lines.push("\x1b[32mnew file\x1b[0m");
    } else if (diff.isDeleted) {
      lines.push(`\x1b[1mdiff --gen-md a/${diff.path} b/${diff.path}\x1b[0m`);
      lines.push("\x1b[31mdeleted file\x1b[0m");
    } else {
      lines.push(`\x1b[1mdiff --gen-md a/${diff.path} b/${diff.path}\x1b[0m`);
    }

    lines.push(`\x1b[1m--- a/${diff.path}\x1b[0m (current)`);
    lines.push(`\x1b[1m+++ b/${diff.path}\x1b[0m (predicted)`);

    // Hunks
    for (const hunk of diff.hunks) {
      lines.push(
        `\x1b[36m@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\x1b[0m`
      );

      for (const line of hunk.lines) {
        if (line.startsWith("+")) {
          lines.push(`\x1b[32m${line}\x1b[0m`);
        } else if (line.startsWith("-")) {
          lines.push(`\x1b[31m${line}\x1b[0m`);
        } else {
          lines.push(line);
        }
      }
    }

    return lines.join("\n");
  }

  /**
   * Generate unified diff string (for git apply compatibility)
   */
  generateUnifiedDiff(
    path: string,
    oldContent: string,
    newContent: string
  ): string {
    return createTwoFilesPatch(
      `a/${path}`,
      `b/${path}`,
      this.normalizeContent(oldContent),
      this.normalizeContent(newContent),
      "current",
      "predicted",
      { context: this.options.contextLines }
    );
  }

  /**
   * Check if there are any changes
   */
  hasChanges(diff: FileDiff): boolean {
    return diff.hunks.length > 0;
  }

  /**
   * Count lines changed
   */
  countChanges(diff: FileDiff): { additions: number; deletions: number } {
    let additions = 0;
    let deletions = 0;

    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        if (line.startsWith("+") && !line.startsWith("+++")) {
          additions++;
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          deletions++;
        }
      }
    }

    return { additions, deletions };
  }

  /**
   * Normalize content - ensure consistent newlines
   */
  private normalizeContent(content: string): string {
    // Ensure content ends with newline
    return content.endsWith("\n") ? content : content + "\n";
  }
}

/**
 * Create a differ instance
 */
export function createDiffer(options?: DiffOptions): Differ {
  return new Differ(options);
}
