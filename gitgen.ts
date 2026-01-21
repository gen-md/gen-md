#!/usr/bin/env npx tsx
/**
 * gitgen - Predictive git. Generate specs from history, branches for features.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, join, basename } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";

// === TYPES ===

interface Spec {
  output: string;
  context?: string[];
  model?: string;
}

interface ParsedSpec {
  spec: Spec;
  body: string;
  filePath: string;
}

// === CONFIG ===

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8192;

// === PARSE ===

function parseSpec(content: string, filePath: string): ParsedSpec {
  const { data, content: body } = matter(content);
  const spec = data as Spec;

  if (!spec.output) {
    throw new Error(`Missing required 'output' field in ${filePath}`);
  }

  if (spec.context && !Array.isArray(spec.context)) {
    spec.context = [spec.context];
  }

  return { spec, body: body.trim(), filePath: resolve(filePath) };
}

// === CONTEXT ===

async function readContext(
  contextPaths: string[],
  specDir: string
): Promise<string> {
  const parts: string[] = [];

  for (const path of contextPaths) {
    const fullPath = path.startsWith("/") ? path : resolve(specDir, path);
    try {
      const content = await readFile(fullPath, "utf-8");
      parts.push(`<file path="${path}">\n${content}\n</file>`);
    } catch {
      parts.push(`<file path="${path}">\n[File not found]\n</file>`);
    }
  }

  return parts.join("\n\n");
}

// === GIT ===

function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function getGitHistory(file: string, limit = 10): string {
  const log = git(`log -${limit} --pretty=format:"%h %s" -- "${file}"`);
  if (!log) return "";

  const commits = log.split("\n").filter(Boolean);
  const diffs: string[] = [];

  for (const commit of commits.slice(0, 5)) {
    const hash = commit.split(" ")[0];
    const diff = git(`show ${hash} -- "${file}"`);
    if (diff) {
      diffs.push(`<commit hash="${hash}">\n${diff}\n</commit>`);
    }
  }

  return diffs.join("\n\n");
}

// === GENERATE ===

async function generate(parsed: ParsedSpec): Promise<string> {
  const client = new Anthropic();
  const specDir = dirname(parsed.filePath);

  let contextSection = "";
  if (parsed.spec.context?.length) {
    const context = await readContext(parsed.spec.context, specDir);
    contextSection = `\n<context>\n${context}\n</context>\n`;
  }

  const prompt = `You are a file generator. Generate the content for: ${parsed.spec.output}
${contextSection}
<instructions>
${parsed.body}
</instructions>

Generate ONLY the file content. No explanations, no markdown code fences.`;

  const response = await client.messages.create({
    model: parsed.spec.model || DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return stripCodeFences(content);
}

async function generateSpec(filePath: string): Promise<string> {
  const client = new Anthropic();
  const fileName = basename(filePath);
  const fileContent = await readFile(filePath, "utf-8");
  const history = getGitHistory(filePath);

  const prompt = `Analyze this file and its git history to create a .gitgen.md spec that could regenerate it.

<file path="${filePath}">
${fileContent}
</file>

${history ? `<git-history>\n${history}\n</git-history>` : ""}

Create a .gitgen.md spec with:
1. YAML frontmatter with output: ${fileName} and relevant context files
2. Clear instructions that capture what this file should contain
3. Any patterns or rules evident from the git history

Output ONLY the .gitgen.md content, starting with ---.`;

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return stripCodeFences(content);
}

async function generateBranch(feature: string): Promise<string[]> {
  const client = new Anthropic();

  // Get repo context
  const recentCommits = git("log -20 --pretty=format:'%h %s'");
  const files = git("ls-files").split("\n").slice(0, 50).join("\n");

  const prompt = `You are implementing a feature in a git repository.

<feature>${feature}</feature>

<recent-commits>
${recentCommits}
</recent-commits>

<files>
${files}
</files>

Plan the implementation:
1. List each file to create or modify
2. For each file, describe what changes are needed

Output as JSON:
{
  "branch": "feature/short-name",
  "files": [
    {"path": "src/file.ts", "action": "create|modify", "description": "what to do"}
  ]
}`;

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse implementation plan");

  const plan = JSON.parse(jsonMatch[0]) as {
    branch: string;
    files: Array<{ path: string; action: string; description: string }>;
  };

  // Create branch
  git(`checkout -b ${plan.branch}`);
  console.log(`Created branch: ${plan.branch}`);

  const createdFiles: string[] = [];

  // Generate each file
  for (const file of plan.files) {
    console.log(`Generating ${file.path}...`);

    let existingContent = "";
    if (file.action === "modify" && existsSync(file.path)) {
      existingContent = await readFile(file.path, "utf-8");
    }

    const filePrompt = `Generate the content for: ${file.path}

<feature>${feature}</feature>
<task>${file.description}</task>
${existingContent ? `<existing>\n${existingContent}\n</existing>` : ""}

Generate ONLY the file content. No explanations, no markdown code fences.`;

    const fileResponse = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: filePrompt }],
    });

    const fileContent = fileResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    // Ensure directory exists
    const dir = dirname(file.path);
    if (dir && dir !== ".") {
      execSync(`mkdir -p "${dir}"`);
    }

    await writeFile(file.path, stripCodeFences(fileContent), "utf-8");
    createdFiles.push(file.path);
  }

  return createdFiles;
}

function stripCodeFences(content: string): string {
  const fencePattern = /^```[\w]*\n([\s\S]*?)\n```$/;
  const match = content.trim().match(fencePattern);
  return match ? match[1] : content;
}

// === DIFF ===

function showDiff(oldContent: string, newContent: string, path: string): void {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  console.log(`\n--- ${path} (current)`);
  console.log(`+++ ${path} (generated)\n`);

  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      console.log(` ${oldLine || ""}`);
    } else if (oldLine === undefined) {
      console.log(`+${newLine}`);
    } else if (newLine === undefined) {
      console.log(`-${oldLine}`);
    } else {
      console.log(`-${oldLine}`);
      console.log(`+${newLine}`);
    }
  }
}

// === RESOLVE ===

function resolveSpecPath(pathArg: string): string {
  if (pathArg.endsWith(".gitgen.md")) {
    if (!existsSync(pathArg)) {
      throw new Error(`File not found: ${pathArg}`);
    }
    return pathArg;
  }

  const dirSpec = join(pathArg, ".gitgen.md");
  if (existsSync(dirSpec)) {
    return dirSpec;
  }

  if (existsSync(pathArg) && !pathArg.includes("/") && !pathArg.includes("\\")) {
    throw new Error(`Not a .gitgen.md file: ${pathArg}`);
  }

  throw new Error(`No .gitgen.md found in ${pathArg === "." ? "current directory" : pathArg}`);
}

// === CLI ===

function printUsage(): void {
  console.log(`gitgen - Predictive git

Usage:
  gitgen .                      Generate from .gitgen.md in current directory
  gitgen <dir>                  Generate from .gitgen.md in directory
  gitgen <spec.gitgen.md>       Generate from specific spec file
  gitgen diff <dir|spec>        Preview generated content
  gitgen init <file>            Create .gitgen.md spec from existing file
  gitgen branch <feature>       Create branch with feature implementation
  gitgen --help                 Show this help

Examples:
  gitgen .                      Generate from ./.gitgen.md
  gitgen init README.md         Create README.gitgen.md from README.md
  gitgen branch "add dark mode" Create feature branch with implementation

Environment:
  ANTHROPIC_API_KEY  Required for generation
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];

  try {
    if (command === "init") {
      // Generate spec from existing file
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: No file provided");
        process.exit(1);
      }
      if (!existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }

      console.log(`Analyzing ${filePath}...`);
      const spec = await generateSpec(filePath);
      const specPath = filePath.replace(/(\.[^.]+)?$/, ".gitgen.md");
      await writeFile(specPath, spec, "utf-8");
      console.log(`Wrote ${specPath}`);
    } else if (command === "branch") {
      // Generate feature branch
      const feature = args.slice(1).join(" ");
      if (!feature) {
        console.error("Error: No feature description provided");
        process.exit(1);
      }

      console.log(`Planning implementation for: ${feature}`);
      const files = await generateBranch(feature);
      console.log(`\nCreated ${files.length} files:`);
      files.forEach((f) => console.log(`  ${f}`));
    } else if (command === "diff") {
      // Preview generation
      const pathArg = args[1];
      if (!pathArg) {
        console.error("Error: No path provided");
        process.exit(1);
      }

      const specPath = resolveSpecPath(pathArg);
      const content = await readFile(specPath, "utf-8");
      const parsed = parseSpec(content, specPath);
      const specDir = dirname(parsed.filePath);
      const outputPath = parsed.spec.output.startsWith("/")
        ? parsed.spec.output
        : resolve(specDir, parsed.spec.output);

      console.log(`Generating ${relative(process.cwd(), outputPath)}...`);
      const generated = await generate(parsed);

      let existing = "";
      try {
        existing = await readFile(outputPath, "utf-8");
      } catch {
        console.log(`(new file)`);
      }
      showDiff(existing, generated, relative(process.cwd(), outputPath));
    } else {
      // Default: generate from spec
      const specPath = resolveSpecPath(command);
      const content = await readFile(specPath, "utf-8");
      const parsed = parseSpec(content, specPath);
      const specDir = dirname(parsed.filePath);
      const outputPath = parsed.spec.output.startsWith("/")
        ? parsed.spec.output
        : resolve(specDir, parsed.spec.output);

      console.log(`Generating ${relative(process.cwd(), outputPath)}...`);
      const generated = await generate(parsed);
      await writeFile(outputPath, generated, "utf-8");
      console.log(`Wrote ${relative(process.cwd(), outputPath)}`);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
