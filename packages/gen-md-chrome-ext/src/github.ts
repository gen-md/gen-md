import { GitHubContext } from "./types.js";

/**
 * Extract GitHub context from current URL
 */
export function getGitHubContext(): GitHubContext | null {
  const url = window.location.href;
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/(?:blob|tree)\/([^/]+)\/(.+))?/
  );

  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] || "main",
    path: match[4] || "",
  };
}

/**
 * Fetch raw file content from GitHub
 */
export async function fetchRawContent(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Check if current page is viewing a .gen.md file
 */
export function isGenMdFile(): boolean {
  const context = getGitHubContext();
  return context?.path.endsWith(".gen.md") ?? false;
}

/**
 * Find all .gen.md files in current directory listing
 */
export function findGenMdFilesInPage(): string[] {
  const files: string[] = [];
  const links = document.querySelectorAll(
    'a[href*=".gen.md"]'
  ) as NodeListOf<HTMLAnchorElement>;

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.endsWith(".gen.md")) {
      files.push(href);
    }
  });

  return files;
}
