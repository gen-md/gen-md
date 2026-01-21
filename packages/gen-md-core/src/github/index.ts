import { execSync } from "node:child_process";
import type {
  GitHubAuth,
  GitHubPR,
  GitHubPRFile,
  PRExample,
} from "../types/index.js";

/**
 * GitHub API client for PR integration
 */
export class GitHubClient {
  private auth: GitHubAuth;
  private baseUrl: string;

  constructor(auth: GitHubAuth) {
    this.auth = auth;
    this.baseUrl = "https://api.github.com";
  }

  /**
   * Authenticate and verify token
   */
  async verify(): Promise<boolean> {
    const response = await this.request("GET", "/user");
    return response.ok;
  }

  /**
   * Get merged PRs that touched specific files
   */
  async getMergedPRsForFiles(
    owner: string,
    repo: string,
    filePaths: string[],
    options: { maxPRs?: number; labels?: string[] } = {}
  ): Promise<GitHubPR[]> {
    const { maxPRs = 5, labels = [] } = options;

    // Use GitHub search API to find relevant PRs
    const query = this.buildPRSearchQuery(owner, repo, labels);
    const response = await this.request(
      "GET",
      `/search/issues?q=${encodeURIComponent(query)}&per_page=${maxPRs}`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      items: Array<{ number: number }>;
    };
    const prs: GitHubPR[] = [];

    for (const item of data.items) {
      const pr = await this.getPR(owner, repo, item.number);
      if (pr) {
        // Filter by files if specified
        if (filePaths.length > 0) {
          const prFiles = pr.files.map((f) => f.path);
          const hasMatchingFile = filePaths.some((fp) => prFiles.includes(fp));
          if (hasMatchingFile) {
            prs.push(pr);
          }
        } else {
          prs.push(pr);
        }
      }
    }

    return prs;
  }

  /**
   * Get a single PR with full details
   */
  async getPR(
    owner: string,
    repo: string,
    number: number
  ): Promise<GitHubPR | null> {
    const prResponse = await this.request(
      "GET",
      `/repos/${owner}/${repo}/pulls/${number}`
    );

    if (!prResponse.ok) return null;

    const prData = (await prResponse.json()) as {
      number: number;
      title: string;
      body: string | null;
      merged_at: string | null;
      state: string;
      base: { ref: string };
      head: { ref: string };
      user: { login: string };
      html_url: string;
    };

    // Get files
    const filesResponse = await this.request(
      "GET",
      `/repos/${owner}/${repo}/pulls/${number}/files`
    );
    const filesData = filesResponse.ok
      ? ((await filesResponse.json()) as Array<{
          filename: string;
          status: string;
          additions: number;
          deletions: number;
          patch?: string;
        }>)
      : [];

    return {
      number: prData.number,
      title: prData.title,
      body: prData.body || "",
      state: prData.merged_at ? "merged" : (prData.state as "open" | "closed"),
      base: prData.base.ref,
      head: prData.head.ref,
      author: prData.user.login,
      mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
      files: filesData.map(this.mapFile),
      url: prData.html_url,
    };
  }

  /**
   * Convert PR to multishot example
   */
  prToExample(pr: GitHubPR, inputFile: string): PRExample {
    // Find the file in the PR
    const file = pr.files.find((f) => f.path === inputFile);

    return {
      input: `PR #${pr.number}: ${pr.title}\n\n${pr.body}`,
      output:
        file?.patch ||
        pr.files.map((f) => `${f.status}: ${f.path}`).join("\n"),
      prNumber: pr.number,
      prTitle: pr.title,
      prUrl: pr.url,
      mergedAt: pr.mergedAt!,
    };
  }

  /**
   * Build search query for PRs
   */
  private buildPRSearchQuery(
    owner: string,
    repo: string,
    labels: string[]
  ): string {
    const parts = [`repo:${owner}/${repo}`, "is:pr", "is:merged"];

    if (labels.length > 0) {
      parts.push(...labels.map((l) => `label:${l}`));
    }

    return parts.join(" ");
  }

  /**
   * Make authenticated request
   */
  private async request(method: string, path: string): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.auth.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "gen-md",
      },
    });
  }

  private mapFile(f: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }): GitHubPRFile {
    return {
      path: f.filename,
      status: f.status as GitHubPRFile["status"],
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch || null,
    };
  }
}

/**
 * Resolve GitHub auth from environment/config
 */
export async function resolveGitHubAuth(): Promise<GitHubAuth | null> {
  // 1. Check GITHUB_TOKEN env var
  if (process.env.GITHUB_TOKEN) {
    return {
      token: process.env.GITHUB_TOKEN,
      source: "env",
    };
  }

  // 2. Check GH_TOKEN (GitHub CLI)
  if (process.env.GH_TOKEN) {
    return {
      token: process.env.GH_TOKEN,
      source: "env",
    };
  }

  // 3. Try gh auth token command
  try {
    const token = execSync("gh auth token", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (token) {
      return {
        token,
        source: "gh-cli",
      };
    }
  } catch {
    // gh CLI not available or not authenticated
  }

  return null;
}

/**
 * Parse GitHub repo from remote URL
 */
export function parseGitHubRepo(
  remoteUrl: string
): { owner: string; repo: string } | null {
  // Handle SSH: git@github.com:owner/repo.git
  // Handle HTTPS: https://github.com/owner/repo.git
  const patterns = [/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/];

  for (const pattern of patterns) {
    const match = remoteUrl.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  return null;
}

/**
 * Factory function
 */
export function createGitHubClient(auth: GitHubAuth): GitHubClient {
  return new GitHubClient(auth);
}
