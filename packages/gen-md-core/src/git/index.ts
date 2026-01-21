import { execSync } from "node:child_process";
import * as path from "node:path";
import type {
  GitContext,
  GitContextOptions,
  GitCommit,
} from "../types/index.js";

/**
 * Git utilities for extracting repository context
 */
export class GitContextExtractor {
  private options: Required<GitContextOptions>;

  constructor(options: GitContextOptions = {}) {
    this.options = {
      maxCommits: options.maxCommits ?? 10,
      filterPaths: options.filterPaths ?? [],
    };
  }

  /**
   * Extract git context for a file or directory
   */
  async extract(targetPath: string): Promise<GitContext> {
    const repoRoot = this.getRepoRoot(targetPath);
    if (!repoRoot) {
      throw new Error("Not a git repository");
    }

    const branch = this.getCurrentBranch(repoRoot);
    const remoteUrl = this.getRemoteUrl(repoRoot);
    const commits = this.getRecentCommits(repoRoot, targetPath);

    return {
      commits,
      branch,
      repoRoot,
      remoteUrl,
    };
  }

  /**
   * Get repository root directory
   */
  private getRepoRoot(fromPath: string): string | null {
    try {
      const dir = path.dirname(path.resolve(fromPath));
      return execSync("git rev-parse --show-toplevel", {
        cwd: dir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Get current branch name
   */
  private getCurrentBranch(repoRoot: string): string {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Get remote URL
   */
  private getRemoteUrl(repoRoot: string): string | null {
    try {
      return execSync("git remote get-url origin", {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Get recent commits affecting the target path
   */
  private getRecentCommits(repoRoot: string, targetPath: string): GitCommit[] {
    const pathFilter =
      this.options.filterPaths.length > 0
        ? this.options.filterPaths.join(" ")
        : path.relative(repoRoot, path.resolve(targetPath));

    try {
      // Use NULL separator for reliable parsing
      const format = "%H%x00%s%x00%b%x00%an%x00%ae%x00%aI%x00";
      const cmd = pathFilter
        ? `git log -n ${this.options.maxCommits} --pretty=format:"${format}" -- ${pathFilter}`
        : `git log -n ${this.options.maxCommits} --pretty=format:"${format}"`;

      const output = execSync(cmd, {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return this.parseCommitLog(output, repoRoot);
    } catch {
      return [];
    }
  }

  /**
   * Parse git log output
   */
  private parseCommitLog(output: string, repoRoot: string): GitCommit[] {
    if (!output.trim()) {
      return [];
    }

    const commits: GitCommit[] = [];
    // Split by the format ending (double NULL)
    const entries = output.split("\x00\x00").filter(Boolean);

    for (const entry of entries) {
      const parts = entry.split("\x00");
      if (parts.length < 6) continue;

      const [hash, subject, body, author, authorEmail, dateStr] = parts;
      const files = this.getCommitFiles(repoRoot, hash);

      commits.push({
        hash,
        subject,
        body: body || "",
        author,
        authorEmail,
        date: new Date(dateStr),
        files,
      });
    }

    return commits;
  }

  /**
   * Get files changed in a commit
   */
  private getCommitFiles(repoRoot: string, hash: string): string[] {
    try {
      return execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      })
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch {
      return [];
    }
  }
}

/**
 * Format git context for prompt inclusion
 */
export function formatGitContextForPrompt(context: GitContext): string {
  const parts: string[] = [];

  parts.push(`## Git Context`);
  parts.push(`Branch: ${context.branch}`);

  if (context.commits.length > 0) {
    parts.push(``);
    parts.push(`### Recent Commits`);
    for (const commit of context.commits) {
      parts.push(`- ${commit.hash.substring(0, 7)} ${commit.subject}`);
      if (commit.body) {
        const bodyLines = commit.body.trim().split("\n");
        for (const line of bodyLines) {
          parts.push(`  ${line}`);
        }
      }
    }
  }

  return parts.join("\n");
}

/**
 * Factory function
 */
export function createGitExtractor(
  options?: GitContextOptions
): GitContextExtractor {
  return new GitContextExtractor(options);
}
