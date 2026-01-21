/**
 * GitGen Store
 *
 * Manages the .gitgen directory structure (like .git).
 * Provides content-addressed storage for predictions and state management.
 */

import { createHash } from "node:crypto";
import {
  access,
  constants,
  mkdir,
  readFile,
  writeFile,
  readdir,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type {
  GenMdConfig,
  GenMdIndex,
  LogEntry,
  StagedSpec,
} from "../types.js";

const GEN_MD_DIR = ".gitgen";
const DEFAULT_BRANCH = "main";

/**
 * Store for gitgen state and objects
 */
export class GenMdStore {
  private root: string;
  private genMdDir: string;

  constructor(root: string) {
    this.root = resolve(root);
    this.genMdDir = join(this.root, GEN_MD_DIR);
  }

  /**
   * Get the .gitgen directory path
   */
  get path(): string {
    return this.genMdDir;
  }

  /**
   * Check if gitgen is initialized in this directory
   */
  async isInitialized(): Promise<boolean> {
    return this.exists(this.genMdDir);
  }

  /**
   * Initialize the .gitgen directory structure
   */
  async init(): Promise<void> {
    // Create directory structure
    await mkdir(join(this.genMdDir, "objects"), { recursive: true });
    await mkdir(join(this.genMdDir, "refs", "heads"), { recursive: true });
    await mkdir(join(this.genMdDir, "logs"), { recursive: true });
    await mkdir(join(this.genMdDir, "stash"), { recursive: true });

    // Initialize HEAD
    await this.setHead(DEFAULT_BRANCH);

    // Initialize config
    const config: GenMdConfig = {
      model: "claude-sonnet-4-20250514",
      defaultBranch: DEFAULT_BRANCH,
    };
    await this.writeConfig(config);

    // Initialize empty index
    await this.writeIndex({ staged: [] });

    // Create default branch ref
    await writeFile(
      join(this.genMdDir, "refs", "heads", DEFAULT_BRANCH),
      "",
      "utf-8"
    );
  }

  // ============================================================================
  // HEAD Management
  // ============================================================================

  /**
   * Get current branch name
   */
  async getHead(): Promise<string> {
    try {
      const content = await readFile(join(this.genMdDir, "HEAD"), "utf-8");
      const match = content.match(/^ref: refs\/heads\/(.+)$/);
      return match ? match[1].trim() : DEFAULT_BRANCH;
    } catch {
      return DEFAULT_BRANCH;
    }
  }

  /**
   * Set current branch
   */
  async setHead(branch: string): Promise<void> {
    await writeFile(
      join(this.genMdDir, "HEAD"),
      `ref: refs/heads/${branch}\n`,
      "utf-8"
    );
  }

  // ============================================================================
  // Config Management
  // ============================================================================

  /**
   * Read config
   */
  async readConfig(): Promise<GenMdConfig> {
    try {
      const content = await readFile(
        join(this.genMdDir, "config"),
        "utf-8"
      );
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * Write config
   */
  async writeConfig(config: GenMdConfig): Promise<void> {
    await writeFile(
      join(this.genMdDir, "config"),
      JSON.stringify(config, null, 2),
      "utf-8"
    );
  }

  // ============================================================================
  // Object Storage (content-addressed)
  // ============================================================================

  /**
   * Compute SHA-256 hash of content
   */
  hash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Write an object to the store
   * Returns the hash
   */
  async writeObject(content: string): Promise<string> {
    const hash = this.hash(content);
    const dir = join(this.genMdDir, "objects", hash.slice(0, 2));
    const file = join(dir, hash.slice(2));

    await mkdir(dir, { recursive: true });
    await writeFile(file, content, "utf-8");

    return hash;
  }

  /**
   * Read an object from the store
   */
  async readObject(hash: string): Promise<string> {
    const file = join(
      this.genMdDir,
      "objects",
      hash.slice(0, 2),
      hash.slice(2)
    );
    return readFile(file, "utf-8");
  }

  /**
   * Check if an object exists
   */
  async objectExists(hash: string): Promise<boolean> {
    const file = join(
      this.genMdDir,
      "objects",
      hash.slice(0, 2),
      hash.slice(2)
    );
    return this.exists(file);
  }

  // ============================================================================
  // Index (Staging) Management
  // ============================================================================

  /**
   * Read the index
   */
  async readIndex(): Promise<GenMdIndex> {
    try {
      const content = await readFile(
        join(this.genMdDir, "index"),
        "utf-8"
      );
      return JSON.parse(content);
    } catch {
      return { staged: [] };
    }
  }

  /**
   * Write the index
   */
  async writeIndex(index: GenMdIndex): Promise<void> {
    await writeFile(
      join(this.genMdDir, "index"),
      JSON.stringify(index, null, 2),
      "utf-8"
    );
  }

  /**
   * Stage a spec for commit
   */
  async stageSpec(
    specPath: string,
    outputPath: string,
    specContent: string
  ): Promise<void> {
    const index = await this.readIndex();
    const specHash = this.hash(specContent);

    // Remove existing entry for same spec
    index.staged = index.staged.filter(
      (s) => s.specPath !== specPath
    );

    // Add new entry
    index.staged.push({
      specPath: resolve(specPath),
      specHash,
      outputPath: resolve(outputPath),
      stagedAt: new Date(),
    });

    await this.writeIndex(index);
  }

  /**
   * Unstage a spec
   */
  async unstageSpec(specPath: string): Promise<void> {
    const index = await this.readIndex();
    index.staged = index.staged.filter(
      (s) => s.specPath !== resolve(specPath)
    );
    await this.writeIndex(index);
  }

  /**
   * Get all staged specs
   */
  async getStagedSpecs(): Promise<StagedSpec[]> {
    const index = await this.readIndex();
    return index.staged;
  }

  /**
   * Clear all staged specs
   */
  async clearStaged(): Promise<void> {
    const index = await this.readIndex();
    index.staged = [];
    await this.writeIndex(index);
  }

  // ============================================================================
  // Log Management
  // ============================================================================

  /**
   * Append to the log for a spec
   */
  async appendLog(entry: LogEntry): Promise<void> {
    const logFile = join(this.genMdDir, "logs", "generations.jsonl");

    // Ensure logs directory exists
    await mkdir(dirname(logFile), { recursive: true });

    // Append as JSONL
    const line = JSON.stringify(entry) + "\n";
    await writeFile(logFile, line, { flag: "a" });
  }

  /**
   * Read log entries for a spec
   */
  async readLog(specPath?: string, limit = 10): Promise<LogEntry[]> {
    const logFile = join(this.genMdDir, "logs", "generations.jsonl");

    try {
      const content = await readFile(logFile, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);

      let entries = lines.map((line) => JSON.parse(line) as LogEntry);

      // Filter by spec path if provided
      if (specPath) {
        const resolved = resolve(specPath);
        entries = entries.filter((e) => e.specPath === resolved);
      }

      // Return most recent first, limited
      return entries.reverse().slice(0, limit);
    } catch {
      return [];
    }
  }

  // ============================================================================
  // Commit Management
  // ============================================================================

  /**
   * Create a commit hash from entries
   */
  createCommitHash(
    message: string,
    entries: Array<{ specPath: string; contentHash: string }>
  ): string {
    const data = JSON.stringify({
      message,
      entries,
      timestamp: new Date().toISOString(),
    });
    return this.hash(data);
  }

  /**
   * Update the branch ref to point to a commit
   */
  async updateBranchRef(branch: string, commitHash: string): Promise<void> {
    await writeFile(
      join(this.genMdDir, "refs", "heads", branch),
      commitHash,
      "utf-8"
    );
  }

  /**
   * Get the latest commit hash for a branch
   */
  async getBranchRef(branch: string): Promise<string | null> {
    try {
      const hash = await readFile(
        join(this.genMdDir, "refs", "heads", branch),
        "utf-8"
      );
      return hash.trim() || null;
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Check if path exists
   */
  private async exists(path: string): Promise<boolean> {
    try {
      await access(path, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find all .gitgen.md files in the repository
   */
  async findAllSpecs(): Promise<string[]> {
    const specs: string[] = [];
    await this.walkDir(this.root, specs);
    return specs;
  }

  /**
   * Recursively walk directory to find .gitgen.md files
   */
  private async walkDir(dir: string, specs: string[]): Promise<void> {
    // Skip .gitgen, node_modules, .git directories
    const basename = dir.split("/").pop();
    if (
      basename === GEN_MD_DIR ||
      basename === "node_modules" ||
      basename === ".git"
    ) {
      return;
    }

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.walkDir(fullPath, specs);
        } else if (entry.name.endsWith(".gitgen.md")) {
          specs.push(fullPath);
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }
}

/**
 * Create a store instance
 */
export function createStore(root: string = process.cwd()): GenMdStore {
  return new GenMdStore(root);
}

/**
 * Find the gitgen root (directory containing .gitgen)
 */
export async function findGenMdRoot(
  startPath: string = process.cwd()
): Promise<string | null> {
  let current = resolve(startPath);

  while (current !== "/") {
    const genMdDir = join(current, GEN_MD_DIR);
    try {
      await access(genMdDir, constants.R_OK);
      return current;
    } catch {
      current = dirname(current);
    }
  }

  return null;
}
