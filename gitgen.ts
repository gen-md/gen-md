#!/usr/bin/env npx tsx
/**
 * gitgen - Predictive git. Generate specs from history, branches for features.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, join, basename } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
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

interface BranchOptions {
  name?: string;
  dryRun?: boolean;
  noCheckout?: boolean;
}

// === CONFIG ===

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8192;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(__dirname, "prompts");

// === PROMPTS ===

async function loadPrompt(name: string): Promise<string> {
  const promptPath = join(PROMPTS_DIR, `${name}.md`);
  return readFile(promptPath, "utf-8");
}

function renderPrompt(
  template: string,
  vars: Record<string, string | undefined>
): string {
  let result = template;

  // Handle conditionals: {{#var}}content{{/var}}
  for (const [key, value] of Object.entries(vars)) {
    const conditionalPattern = new RegExp(
      `\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`,
      "g"
    );
    result = result.replace(conditionalPattern, value ? "$1" : "");
  }

  // Handle simple substitutions: {{var}}
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "");
  }

  return result.trim();
}

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

// === LLM ===

async function llm(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return stripCodeFences(content);
}

function stripCodeFences(content: string): string {
  const fencePattern = /^```[\w]*\n([\s\S]*?)\n```$/;
  const match = content.trim().match(fencePattern);
  return match ? match[1] : content;
}

// === GENERATE ===

async function generate(parsed: ParsedSpec): Promise<string> {
  const specDir = dirname(parsed.filePath);
  const template = await loadPrompt("generate");

  let contextSection = "";
  if (parsed.spec.context?.length) {
    contextSection = await readContext(parsed.spec.context, specDir);
  }

  const prompt = renderPrompt(template, {
    output: parsed.spec.output,
    context: contextSection,
    instructions: parsed.body,
  });

  return llm(prompt, parsed.spec.model);
}

async function generateSpec(filePath: string): Promise<string> {
  const template = await loadPrompt("init");
  const fileName = basename(filePath);
  const fileContent = await readFile(filePath, "utf-8");
  const history = getGitHistory(filePath);

  const prompt = renderPrompt(template, {
    filePath,
    fileName,
    fileContent,
    history,
  });

  return llm(prompt);
}

async function generateBranch(
  feature: string,
  options: BranchOptions = {}
): Promise<string[]> {
  const planTemplate = await loadPrompt("branch-plan");
  const fileTemplate = await loadPrompt("branch-file");

  const recentCommits = git("log -20 --pretty=format:'%h %s'");
  const files = git("ls-files").split("\n").slice(0, 50).join("\n");

  const planPrompt = renderPrompt(planTemplate, {
    feature,
    recentCommits,
    files,
  });

  const planResponse = await llm(planPrompt);

  // Parse JSON response
  const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse implementation plan");

  const plan = JSON.parse(jsonMatch[0]) as {
    branch: string;
    files: Array<{ path: string; action: string; description: string }>;
  };

  // Use provided name or LLM-derived name
  const branchName = options.name || plan.branch;

  // Dry run: show plan and exit
  if (options.dryRun) {
    console.log(`→ Branch: ${branchName}`);
    console.log(`→ Files to generate:`);
    for (const file of plan.files) {
      console.log(`  ${file.action === "modify" ? "~" : "+"} ${file.path}`);
      console.log(`    ${file.description}`);
    }
    return [];
  }

  // Create branch
  const currentBranch = git("branch --show-current");
  git(`checkout -b ${branchName}`);
  console.log(`→ Branch: ${branchName}`);
  console.log(`→ Generating files...`);

  const createdFiles: string[] = [];

  // Generate each file
  for (const file of plan.files) {
    let existing = "";
    if (file.action === "modify" && existsSync(file.path)) {
      existing = await readFile(file.path, "utf-8");
    }

    const filePrompt = renderPrompt(fileTemplate, {
      filePath: file.path,
      feature,
      task: file.description,
      existing,
    });

    const fileContent = await llm(filePrompt);

    // Ensure directory exists
    const dir = dirname(file.path);
    if (dir && dir !== ".") {
      execSync(`mkdir -p "${dir}"`);
    }

    await writeFile(file.path, fileContent, "utf-8");
    createdFiles.push(file.path);
    console.log(`  + ${file.path}`);
  }

  // Return to original branch if --no-checkout
  if (options.noCheckout && currentBranch) {
    git(`checkout ${currentBranch}`);
    console.log(`→ Returned to: ${currentBranch}`);
  }

  return createdFiles;
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
  console.log(`git gen - Predictive git

Usage:
  git gen .                      Generate from .gitgen.md in current directory
  git gen <dir>                  Generate from .gitgen.md in directory
  git gen <spec.gitgen.md>       Generate from specific spec file
  git gen diff <dir|spec>        Preview generated content
  git gen init <file>            Create .gitgen.md spec from existing file
  git gen branch [options] <feature>
                                 Create branch with feature implementation
  git gen --help                 Show this help

Branch options:
  -n, --name <name>              Specify branch name (default: LLM derives)
  --dry-run                      Show plan without creating branch/files
  --no-checkout                  Create branch but stay on current branch

Examples:
  git gen .                      Generate from ./.gitgen.md
  git gen init README.md         Create README.gitgen.md from README.md
  git gen branch "add dark mode" Create feature branch with implementation
  git gen branch --dry-run "add auth"
                                 Preview implementation plan
  git gen branch -n feature/auth "add JWT authentication"
                                 Specify branch name

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
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: No file provided");
        process.exit(1);
      }
      if (!existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }

      console.log(`→ Analyzing: ${filePath}`);
      console.log(`→ Reading git history...`);
      const spec = await generateSpec(filePath);
      const specPath = filePath.replace(/(\.[^.]+)?$/, ".gitgen.md");
      await writeFile(specPath, spec, "utf-8");
      console.log(`✓ Wrote ${specPath}`);
    } else if (command === "branch") {
      // Parse options
      let branchName: string | undefined;
      let dryRun = false;
      let noCheckout = false;
      const featureParts: string[] = [];

      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg === "-n" || arg === "--name") {
          branchName = args[++i];
        } else if (arg === "--dry-run") {
          dryRun = true;
        } else if (arg === "--no-checkout") {
          noCheckout = true;
        } else if (!arg.startsWith("-")) {
          featureParts.push(arg);
        }
      }

      const feature = featureParts.join(" ");
      if (!feature) {
        console.error("Error: No feature description provided");
        process.exit(1);
      }

      console.log(`→ Planning: ${feature}`);
      const files = await generateBranch(feature, {
        name: branchName,
        dryRun,
        noCheckout,
      });

      if (dryRun) {
        console.log(`\n(dry run - no changes made)`);
      } else {
        console.log(`\n✓ Created ${files.length} files`);
      }
    } else if (command === "diff") {
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

      console.log(`→ Generating: ${relative(process.cwd(), outputPath)}`);
      const generated = await generate(parsed);

      let existing = "";
      try {
        existing = await readFile(outputPath, "utf-8");
      } catch {
        console.log(`  (new file)`);
      }
      showDiff(existing, generated, relative(process.cwd(), outputPath));
    } else {
      const specPath = resolveSpecPath(command);
      const content = await readFile(specPath, "utf-8");
      const parsed = parseSpec(content, specPath);
      const specDir = dirname(parsed.filePath);
      const outputPath = parsed.spec.output.startsWith("/")
        ? parsed.spec.output
        : resolve(specDir, parsed.spec.output);

      console.log(`→ Generating: ${relative(process.cwd(), outputPath)}`);
      const generated = await generate(parsed);
      await writeFile(outputPath, generated, "utf-8");
      console.log(`✓ Wrote ${relative(process.cwd(), outputPath)}`);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
