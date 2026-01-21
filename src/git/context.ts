/**
 * Git Context Extraction
 *
 * Extracts git repository context using the git CLI.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import type { GitCommit, GitContext, GitContextOptions } from "../types.js";

const execAsync = promisify(exec);

const DEFAULT_MAX_COMMITS = 10;

/**
 * Git context extractor
 */
export class GitContextExtractor {
  private options: Required<GitContextOptions>;

  constructor(options: GitContextOptions = {}) {
    this.options = {
      maxCommits: options.maxCommits ?? DEFAULT_MAX_COMMITS,
      filterPaths: options.filterPaths ?? [],
    };
  }

  /**
   * Extract git context for a given path
   */
  async extract(targetPath: string): Promise<GitContext> {
    const absolutePath = resolve(targetPath);
    const workDir = dirname(absolutePath);

    // Get repo root
    const repoRoot = await this.getRepoRoot(workDir);
    if (!repoRoot) {
      throw new Error("Not a git repository");
    }

    // Get context in parallel
    const [branch, remoteUrl, commits] = await Promise.all([
      this.getCurrentBranch(repoRoot),
      this.getRemoteUrl(repoRoot),
      this.getRecentCommits(repoRoot, absolutePath),
    ]);

    return {
      repoRoot,
      branch,
      remoteUrl,
      commits,
    };
  }

  /**
   * Find git repository root
   */
  async getRepoRoot(cwd: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync("git rev-parse --show-toplevel", {
        cwd,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(cwd: string): Promise<string> {
    try {
      const { stdout } = await execAsync("git rev-parse --abbrev-ref HEAD", {
        cwd,
      });
      return stdout.trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Get remote origin URL
   */
  async getRemoteUrl(cwd: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        "git remote get-url origin",
        { cwd }
      );
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Get recent commits affecting a path
   */
  async getRecentCommits(
    repoRoot: string,
    targetPath: string
  ): Promise<GitCommit[]> {
    const commits: GitCommit[] = [];
    const relativePath = targetPath.replace(repoRoot + "/", "");

    try {
      // Build git log command with NULL separators for reliable parsing
      const format = [
        "%H", // Hash
        "%s", // Subject
        "%b", // Body
        "%an", // Author name
        "%ae", // Author email
        "%aI", // Author date ISO
      ].join("%x00");

      // Get commits affecting this path (or all commits if no filter)
      const pathArg =
        this.options.filterPaths.length > 0
          ? this.options.filterPaths.join(" ")
          : relativePath;

      const { stdout } = await execAsync(
        `git log -${this.options.maxCommits} --format="${format}%x00%x00" -- ${pathArg}`,
        { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 }
      );

      if (!stdout.trim()) return commits;

      // Split by double NULL (commit separator)
      const commitStrings = stdout.split("\0\0").filter(Boolean);

      for (const commitStr of commitStrings) {
        const parts = commitStr.trim().split("\0");
        if (parts.length < 6) continue;

        const [hash, subject, body, author, authorEmail, dateStr] = parts;

        // Get files changed in this commit
        const files = await this.getCommitFiles(repoRoot, hash);

        commits.push({
          hash: hash.trim(),
          subject: subject.trim(),
          body: body.trim(),
          author: author.trim(),
          authorEmail: authorEmail.trim(),
          date: new Date(dateStr.trim()),
          files,
        });
      }
    } catch {
      // Return empty array if git log fails
    }

    return commits;
  }

  /**
   * Get files changed in a commit
   */
  async getCommitFiles(repoRoot: string, hash: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        `git diff-tree --no-commit-id --name-only -r ${hash}`,
        { cwd: repoRoot }
      );
      return stdout
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch {
      return [];
    }
  }
}

/**
 * Create a git context extractor
 */
export function createGitExtractor(
  options?: GitContextOptions
): GitContextExtractor {
  return new GitContextExtractor(options);
}

/**
 * Format git context for inclusion in a prompt
 */
export function formatGitContextForPrompt(context: GitContext): string {
  const lines: string[] = [];

  lines.push("## Git Context\n");
  lines.push(`**Branch:** ${context.branch}`);

  if (context.remoteUrl) {
    lines.push(`**Remote:** ${context.remoteUrl}`);
  }

  if (context.commits.length > 0) {
    lines.push("\n### Recent Commits\n");
    for (const commit of context.commits.slice(0, 5)) {
      const date = commit.date.toISOString().split("T")[0];
      lines.push(`- \`${commit.hash.slice(0, 7)}\` ${commit.subject} (${date})`);
      if (commit.files.length > 0) {
        lines.push(`  Files: ${commit.files.slice(0, 3).join(", ")}${commit.files.length > 3 ? "..." : ""}`);
      }
    }
  }

  return lines.join("\n");
}
