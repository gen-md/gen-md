import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { llm } from "../providers/index.js";

export interface CommitInfo {
  hash: string;
  subject: string;
  files: string[];
  diff?: string;
}

export interface ConventionInfo {
  commitStyle: string;
  namingPatterns: string[];
  directoryPatterns: string[];
}

export interface FileInfo {
  path: string;
  content: string;
}

export interface RepoAnalysis {
  recentCommits: CommitInfo[];
  fileStructure: string[];
  conventions: ConventionInfo;
  techStack: string[];
  keyFiles: FileInfo[];
}

/**
 * Execute a git command and return the output.
 */
function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

/**
 * Get recent commits with file changes.
 */
function getRecentCommits(limit: number): CommitInfo[] {
  const log = git(`log -${limit} --pretty=format:"%h|%s"`);
  const commits: CommitInfo[] = [];

  for (const line of log.split("\n").filter(Boolean)) {
    const [hash, subject] = line.split("|");
    const files = git(`diff-tree --no-commit-id --name-only -r ${hash}`)
      .split("\n")
      .filter(Boolean);

    commits.push({ hash, subject, files });
  }

  // Get diffs for recent commits (limit to avoid token explosion)
  for (const commit of commits.slice(0, 10)) {
    const diff = git(`show ${commit.hash} --stat -p -U2`);
    if (diff) {
      // Truncate large diffs
      commit.diff = diff.length > 3000 ? diff.slice(0, 3000) + "\n... (truncated)" : diff;
    }
  }

  return commits;
}

/**
 * Detect tech stack from file extensions and config files.
 */
function detectTechStack(files: string[]): string[] {
  const stack: string[] = [];

  if (files.some((f) => f === "package.json")) stack.push("node");
  if (files.some((f) => f.endsWith(".ts") || f.endsWith(".tsx"))) stack.push("typescript");
  if (files.some((f) => f.endsWith(".jsx") || f.endsWith(".tsx"))) stack.push("react");
  if (files.some((f) => f === "next.config.js" || f === "next.config.mjs" || f === "next.config.ts"))
    stack.push("nextjs");
  if (files.some((f) => f === "vite.config.ts" || f === "vite.config.js")) stack.push("vite");
  if (files.some((f) => f === "requirements.txt" || f === "pyproject.toml")) stack.push("python");
  if (files.some((f) => f === "go.mod")) stack.push("go");
  if (files.some((f) => f === "Cargo.toml")) stack.push("rust");
  if (files.some((f) => f === "Gemfile")) stack.push("ruby");
  if (files.some((f) => f === "pom.xml" || f === "build.gradle")) stack.push("java");
  if (files.some((f) => f.endsWith(".vue"))) stack.push("vue");
  if (files.some((f) => f.endsWith(".svelte"))) stack.push("svelte");
  if (files.some((f) => f === "tailwind.config.js" || f === "tailwind.config.ts"))
    stack.push("tailwind");

  return stack;
}

/**
 * Analyze naming and directory conventions from commits and files.
 */
function analyzeConventions(commits: CommitInfo[], files: string[]): ConventionInfo {
  // Detect commit message style
  const subjects = commits.map((c) => c.subject);
  let commitStyle = "freeform";

  const conventionalCount = subjects.filter((s) =>
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/.test(s)
  ).length;
  const bracketedCount = subjects.filter((s) => /^\[.+\]/.test(s)).length;

  if (conventionalCount > subjects.length * 0.5) {
    commitStyle = "conventional";
  } else if (bracketedCount > subjects.length * 0.3) {
    commitStyle = "bracketed";
  }

  // Detect naming patterns
  const namingPatterns: string[] = [];
  const tsFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const jsFiles = files.filter((f) => f.endsWith(".js") || f.endsWith(".jsx"));
  const codeFiles = [...tsFiles, ...jsFiles];

  if (codeFiles.some((f) => /[A-Z][a-z]+\.(tsx?|jsx?)$/.test(f))) {
    namingPatterns.push("PascalCase for components");
  }
  if (codeFiles.some((f) => /[a-z]+-[a-z]+\.(tsx?|jsx?)$/.test(f))) {
    namingPatterns.push("kebab-case for files");
  }
  if (codeFiles.some((f) => /[a-z]+[A-Z][a-z]+\.(tsx?|jsx?)$/.test(f))) {
    namingPatterns.push("camelCase for files");
  }
  if (codeFiles.some((f) => /[a-z]+_[a-z]+\.(tsx?|jsx?)$/.test(f))) {
    namingPatterns.push("snake_case for files");
  }

  // Detect directory patterns
  const directoryPatterns: string[] = [];
  const dirs = [...new Set(files.map((f) => f.split("/")[0]))];

  if (dirs.includes("src")) directoryPatterns.push("src/ for source code");
  if (dirs.includes("lib")) directoryPatterns.push("lib/ for libraries");
  if (dirs.includes("utils") || files.some((f) => f.includes("/utils/")))
    directoryPatterns.push("utils/ for utilities");
  if (dirs.includes("components") || files.some((f) => f.includes("/components/")))
    directoryPatterns.push("components/ for UI components");
  if (dirs.includes("pages") || files.some((f) => f.includes("/pages/")))
    directoryPatterns.push("pages/ for routes");
  if (dirs.includes("app") || files.some((f) => f.includes("/app/")))
    directoryPatterns.push("app/ for Next.js app router");
  if (dirs.includes("tests") || dirs.includes("test") || dirs.includes("__tests__"))
    directoryPatterns.push("tests/ for test files");
  if (dirs.includes("hooks") || files.some((f) => f.includes("/hooks/")))
    directoryPatterns.push("hooks/ for React hooks");
  if (dirs.includes("api") || files.some((f) => f.includes("/api/")))
    directoryPatterns.push("api/ for API routes");

  return { commitStyle, namingPatterns, directoryPatterns };
}

/**
 * Read key configuration and documentation files.
 */
async function readKeyFiles(files: string[]): Promise<FileInfo[]> {
  const keyFilePatterns = [
    "package.json",
    "tsconfig.json",
    ".eslintrc.json",
    ".eslintrc.js",
    "eslint.config.js",
    ".prettierrc",
    ".prettierrc.json",
    "README.md",
    "CONTRIBUTING.md",
  ];

  const keyFiles: FileInfo[] = [];

  for (const pattern of keyFilePatterns) {
    const match = files.find((f) => f.endsWith(pattern));
    if (match && existsSync(match)) {
      try {
        const content = await readFile(match, "utf-8");
        // Truncate large files
        keyFiles.push({
          path: match,
          content: content.length > 2000 ? content.slice(0, 2000) + "\n... (truncated)" : content,
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  return keyFiles;
}

/**
 * Analyze the repository to understand its patterns and conventions.
 */
export async function analyzeRepo(depth: number = 50): Promise<RepoAnalysis> {
  // Get recent commits with context
  const commits = getRecentCommits(depth);

  // Analyze file structure
  const files = git("ls-files").split("\n").filter(Boolean);

  // Detect tech stack from files
  const techStack = detectTechStack(files);

  // Analyze naming and directory conventions
  const conventions = analyzeConventions(commits, files);

  // Read key configuration files
  const keyFiles = await readKeyFiles(files);

  return {
    recentCommits: commits,
    fileStructure: files,
    conventions,
    techStack,
    keyFiles,
  };
}

/**
 * Render a prompt template with variables.
 */
function renderPrompt(template: string, vars: Record<string, string | undefined>): string {
  let result = template;

  // Handle conditionals: {{#var}}content{{/var}}
  for (const [key, value] of Object.entries(vars)) {
    const conditionalPattern = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, "g");
    if (value) {
      result = result.replace(conditionalPattern, "$1");
    } else {
      result = result.replace(conditionalPattern, "");
    }
  }

  // Handle simple substitutions: {{var}}
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }

  return result.trim();
}

/**
 * Generate a .gitgen.md specification for the repository.
 */
export async function generateProjectSpec(): Promise<string> {
  const analysis = await analyzeRepo(50);

  const template = `Analyze this repository and create a .gitgen.md specification.

<tech-stack>{{techStack}}</tech-stack>

<conventions>
Commit style: {{commitStyle}}
Naming patterns:
{{namingPatterns}}
Directory patterns:
{{directoryPatterns}}
</conventions>

<recent-commits>
{{recentCommits}}
</recent-commits>

{{#recentDiffs}}
<recent-diffs>
{{recentDiffs}}
</recent-diffs>
{{/recentDiffs}}

<key-files>
{{keyFiles}}
</key-files>

<file-structure>
{{fileStructure}}
</file-structure>

Create a .gitgen.md file. The file MUST follow this EXACT format:

---
output:
context:
  - ./package.json
  - ./README.md
---

[Instructions for generating new features go here]

REQUIREMENTS:
1. Start with exactly "---" on the first line
2. Include "output:" field (leave value empty)
3. Include "context:" with relevant file paths as a YAML array
4. End frontmatter with exactly "---" on its own line
5. After the closing "---", write instructions describing:
   - What the project does
   - Tech stack: {{techStack}}
   - Coding conventions and patterns
   - Directory structure guidance
   - How new features should match existing patterns

Output ONLY the .gitgen.md content. No markdown code fences. Start with ---`;

  const prompt = renderPrompt(template, {
    techStack: analysis.techStack.join(", ") || "not detected",
    commitStyle: analysis.conventions.commitStyle,
    namingPatterns: analysis.conventions.namingPatterns.join("\n") || "not detected",
    directoryPatterns: analysis.conventions.directoryPatterns.join("\n") || "not detected",
    recentCommits: analysis.recentCommits
      .slice(0, 20)
      .map((c) => `${c.hash} ${c.subject}`)
      .join("\n"),
    recentDiffs: analysis.recentCommits
      .slice(0, 5)
      .map((c) => c.diff)
      .filter(Boolean)
      .join("\n\n"),
    keyFiles: analysis.keyFiles
      .map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
      .join("\n\n"),
    fileStructure: analysis.fileStructure.slice(0, 100).join("\n"),
  });

  return llm(prompt);
}

/**
 * Get a summary of the repository analysis.
 */
export async function getRepoSummary(): Promise<string> {
  const analysis = await analyzeRepo(20);

  const lines = [
    `Tech stack: ${analysis.techStack.join(", ") || "not detected"}`,
    `Commit style: ${analysis.conventions.commitStyle}`,
    `Files: ${analysis.fileStructure.length}`,
    `Recent commits: ${analysis.recentCommits.length}`,
  ];

  if (analysis.conventions.namingPatterns.length > 0) {
    lines.push(`Naming: ${analysis.conventions.namingPatterns.join(", ")}`);
  }

  if (analysis.conventions.directoryPatterns.length > 0) {
    lines.push(`Structure: ${analysis.conventions.directoryPatterns.join(", ")}`);
  }

  return lines.join("\n");
}
