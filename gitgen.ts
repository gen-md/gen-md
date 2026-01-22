#!/usr/bin/env npx tsx
/**
 * gitgen - Predictive git. Generate specs from history, branches for features.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, join, basename } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { llm, getProviderDescription } from "./src/providers/index.js";
import { validateOutput, formatValidationResult } from "./src/validation/index.js";
import { generateProjectSpec, getRepoSummary } from "./src/learn/index.js";

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

interface GenOptions {
  branch?: string;
  dryRun?: boolean;
  prompt?: string;
}

// === CONFIG ===

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

function branchExists(name: string): boolean {
  return git(`rev-parse --verify ${name}`) !== "";
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

async function readFilesSafe(paths: string[]): Promise<string> {
  const parts: string[] = [];
  for (const path of paths) {
    if (existsSync(path)) {
      try {
        const content = await readFile(path, "utf-8");
        // Limit file size to avoid token explosion
        const truncated = content.length > 5000
          ? content.slice(0, 5000) + "\n... (truncated)"
          : content;
        parts.push(`<file path="${path}">\n${truncated}\n</file>`);
      } catch {
        // Skip unreadable files
      }
    }
  }
  return parts.join("\n\n");
}

function getProjectContext(allFiles: string[]): string[] {
  // Priority files for understanding project structure
  const priorityPatterns = [
    /^package\.json$/,
    /^tsconfig\.json$/,
    /^\.env\.example$/,
    /^src\/index\.(ts|js|tsx|jsx)$/,
    /^src\/app\.(ts|js|tsx|jsx)$/,
    /^src\/main\.(ts|js|tsx|jsx)$/,
  ];

  const contextFiles: string[] = [];

  // Add priority files first
  for (const pattern of priorityPatterns) {
    const match = allFiles.find(f => pattern.test(f));
    if (match) contextFiles.push(match);
  }

  // Add a few source files to show patterns (max 5 total)
  const sourceFiles = allFiles.filter(f =>
    /\.(ts|js|tsx|jsx)$/.test(f) &&
    !contextFiles.includes(f) &&
    !f.includes("node_modules") &&
    !f.includes(".test.") &&
    !f.includes(".spec.")
  );

  for (const f of sourceFiles.slice(0, 5 - contextFiles.length)) {
    contextFiles.push(f);
  }

  return contextFiles;
}

function findRelatedFiles(targetPath: string, allFiles: string[]): string[] {
  const dir = dirname(targetPath);
  const ext = targetPath.split('.').pop() || '';

  // Files in same directory or parent
  const related = allFiles.filter(f => {
    const fDir = dirname(f);
    return (fDir === dir || fDir === dirname(dir)) &&
           f !== targetPath &&
           f.endsWith(`.${ext}`);
  });

  // Also look for similar named files (e.g., other routes, other middleware)
  const baseName = basename(targetPath).replace(/\.[^.]+$/, '');
  const similar = allFiles.filter(f => {
    const fBase = basename(f).replace(/\.[^.]+$/, '');
    return f !== targetPath &&
           f.endsWith(`.${ext}`) &&
           (f.includes(dirname(targetPath).split('/').pop() || '') ||
            fBase.length > 3 && baseName.includes(fBase.slice(0, 3)));
  });

  return [...new Set([...related, ...similar])].slice(0, 3);
}


// === GENERATE ===

async function generate(parsed: ParsedSpec, customPrompt?: string): Promise<string> {
  const specDir = dirname(parsed.filePath);
  const template = await loadPrompt("generate");

  let contextSection = "";
  if (parsed.spec.context?.length) {
    contextSection = await readContext(parsed.spec.context, specDir);
  }

  let instructions = parsed.body;
  if (customPrompt) {
    instructions = `${parsed.body}\n\nADDITIONAL INSTRUCTIONS:\n${customPrompt}`;
  }

  const prompt = renderPrompt(template, {
    output: parsed.spec.output,
    context: contextSection,
    instructions,
  });

  return llm(prompt, parsed.spec.model);
}

async function generateSpec(filePath: string, customPrompt?: string): Promise<string> {
  const template = await loadPrompt("init");
  const fileName = basename(filePath);
  const fileContent = await readFile(filePath, "utf-8");
  const history = getGitHistory(filePath);

  let extraInstructions = "";
  if (customPrompt) {
    extraInstructions = `\n\nADDITIONAL INSTRUCTIONS:\n${customPrompt}`;
  }

  const prompt = renderPrompt(template, {
    filePath,
    fileName,
    fileContent,
    history,
  }) + extraInstructions;

  const result = await llm(prompt);
  // Fix common YAML formatting issues from LLMs (missing space after dash)
  return result.replace(/^(\s*)-(\..*)$/gm, "$1- $2");
}

function getRecentDiffs(limit = 5): string {
  const log = git(`log -${limit} --pretty=format:"%h"`);
  if (!log) return "";

  const hashes = log.split("\n").filter(Boolean);
  const diffs: string[] = [];

  for (const hash of hashes) {
    // Get commit message and diff (limited to avoid token explosion)
    const subject = git(`log -1 --pretty=format:"%s" ${hash}`);
    const diff = git(`show ${hash} --stat --patch -U2`);
    if (diff) {
      // Truncate large diffs
      const truncated = diff.length > 3000
        ? diff.slice(0, 3000) + "\n... (truncated)"
        : diff;
      diffs.push(`<commit hash="${hash}" subject="${subject}">\n${truncated}\n</commit>`);
    }
  }

  return diffs.join("\n\n");
}

async function generateFeature(
  feature: string,
  options: GenOptions = {}
): Promise<string[]> {
  const planTemplate = await loadPrompt("branch-plan");
  const fileTemplate = await loadPrompt("branch-file");

  const recentCommits = git("log -20 --pretty=format:'%h %s'");
  const recentDiffs = getRecentDiffs(5);
  const allFiles = git("ls-files").split("\n").filter(Boolean);
  const fileList = allFiles.slice(0, 100).join("\n");

  // Read key files for project context
  const contextFiles = getProjectContext(allFiles);
  const projectContext = await readFilesSafe(contextFiles);

  // Include custom prompt instructions if provided
  const featureWithPrompt = options.prompt
    ? `${feature}\n\nADDITIONAL INSTRUCTIONS:\n${options.prompt}`
    : feature;

  const planPrompt = renderPrompt(planTemplate, {
    feature: featureWithPrompt,
    recentCommits,
    recentDiffs,
    files: fileList,
    projectContext,
  });

  const planResponse = await llm(planPrompt);

  // Parse JSON response
  const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse implementation plan");

  // Validate the plan
  const planValidation = validateOutput(jsonMatch[0], { type: "plan" });
  if (!planValidation.valid) {
    console.error(formatValidationResult(planValidation, "implementation plan"));
    throw new Error("Invalid implementation plan");
  }

  const plan = JSON.parse(jsonMatch[0]) as {
    files: Array<{ path: string; action: string; description: string }>;
  };

  // Handle branch: -b creates/switches, otherwise stay on current
  if (options.branch) {
    const current = git("branch --show-current");
    if (current === options.branch) {
      console.log(`→ Branch: ${options.branch}`);
    } else if (branchExists(options.branch)) {
      git(`checkout ${options.branch}`);
      console.log(`→ Branch: ${options.branch}`);
    } else {
      git(`checkout -b ${options.branch}`);
      console.log(`→ Branch: ${options.branch} (new)`);
    }
  }

  // Dry run: show plan and exit
  if (options.dryRun) {
    console.log(`→ Files to generate:`);
    for (const file of plan.files) {
      console.log(`  ${file.action === "modify" ? "~" : "+"} ${file.path}`);
      console.log(`    ${file.description}`);
    }
    return [];
  }

  console.log(`→ Generating files...`);

  const createdFiles: string[] = [];

  // Generate each file
  for (const file of plan.files) {
    let existing = "";
    if (file.action === "modify" && existsSync(file.path)) {
      existing = await readFile(file.path, "utf-8");
    }

    // Find related files for context
    const relatedPaths = findRelatedFiles(file.path, allFiles);
    const relatedContext = await readFilesSafe(relatedPaths);

    const filePrompt = renderPrompt(fileTemplate, {
      filePath: file.path,
      feature,
      task: file.description,
      existing,
      relatedFiles: relatedContext,
    });

    const fileContent = await llm(filePrompt);

    // Validate the generated content
    const validation = validateOutput(fileContent, { type: "file", filePath: file.path });
    if (!validation.valid) {
      console.error(formatValidationResult(validation, file.path));
    } else if (validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        console.log(`  ⚠ ${warning}`);
      }
    }

    // Ensure directory exists
    const dir = dirname(file.path);
    if (dir && dir !== ".") {
      execSync(`mkdir -p "${dir}"`);
    }

    await writeFile(file.path, fileContent, "utf-8");
    createdFiles.push(file.path);
    console.log(`  + ${file.path}`);
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

// === MERGE ===

interface MergePlan {
  strategy: "select" | "join" | "hybrid";
  analysis: {
    branch1Summary: string;
    branch2Summary: string;
    conflicts: string[];
    resolution: string;
  };
  files: Array<{
    path: string;
    action: "create" | "modify" | "delete";
    source: string;
    description: string;
  }>;
  commands: string[];
}

function getBranchDiff(branch: string, baseBranch: string): string {
  // Get the diff between branch and base
  const diff = git(`diff ${baseBranch}...${branch} --stat`);
  const files = git(`diff ${baseBranch}...${branch} --name-only`);
  const commits = git(`log ${baseBranch}..${branch} --pretty=format:"%h %s" --no-merges`);

  return `Branch: ${branch}
Commits:
${commits || "(no commits)"}

Files changed:
${files || "(no files)"}

Diff summary:
${diff || "(no diff)"}`;
}

async function mergeBranches(
  branches: string[],
  instruction: string,
  options: GenOptions = {}
): Promise<void> {
  if (branches.length < 2) {
    throw new Error("Merge requires at least 2 branches");
  }

  const template = await loadPrompt("merge");
  const currentBranch = git("branch --show-current");
  const baseBranch = git("rev-parse --abbrev-ref HEAD");

  // Get diff info for each branch
  const branchInfo: string[] = [];
  for (const branch of branches) {
    if (!branchExists(branch)) {
      throw new Error(`Branch not found: ${branch}`);
    }
    branchInfo.push(getBranchDiff(branch, baseBranch));
  }

  // Get project context
  const allFiles = git("ls-files").split("\n").filter(Boolean);
  const contextFiles = getProjectContext(allFiles);
  const projectContext = await readFilesSafe(contextFiles);

  const prompt = renderPrompt(template, {
    instruction,
    branches: branchInfo.join("\n\n---\n\n"),
    currentBranch,
    projectContext,
  });

  console.log(`→ Analyzing ${branches.length} branches...`);
  const response = await llm(prompt);

  // Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse merge plan");

  const plan = JSON.parse(jsonMatch[0]) as MergePlan;

  console.log(`→ Strategy: ${plan.strategy}`);
  console.log(`→ Analysis:`);
  for (let i = 0; i < branches.length; i++) {
    const key = `branch${i + 1}Summary` as keyof typeof plan.analysis;
    if (plan.analysis[key]) {
      console.log(`  ${branches[i]}: ${plan.analysis[key]}`);
    }
  }

  if (plan.analysis.conflicts.length > 0) {
    console.log(`→ Conflicts detected:`);
    for (const conflict of plan.analysis.conflicts) {
      console.log(`  - ${conflict}`);
    }
    console.log(`→ Resolution: ${plan.analysis.resolution}`);
  }

  console.log(`→ Files to merge:`);
  for (const file of plan.files) {
    const symbol = file.action === "delete" ? "-" : file.action === "create" ? "+" : "~";
    console.log(`  ${symbol} ${file.path} (from ${file.source})`);
  }

  // Dry run: show plan and exit
  if (options.dryRun) {
    console.log(`\n→ Commands that would be executed:`);
    for (const cmd of plan.commands) {
      console.log(`  ${cmd}`);
    }
    console.log(`\n(dry run - no changes made)`);
    return;
  }

  // Execute merge commands
  console.log(`→ Executing merge...`);
  for (const cmd of plan.commands) {
    console.log(`  $ ${cmd}`);
    try {
      execSync(cmd, { stdio: "inherit" });
    } catch (error) {
      console.error(`  ✗ Command failed: ${cmd}`);
      throw error;
    }
  }

  console.log(`\n✓ Merge complete`);
}

// === CLI ===

function printUsage(): void {
  console.log(`git gen - Predictive git

Usage:
  git gen learn                  Analyze repo, create .gitgen.md
  git gen "feature"              Generate files for a feature
  git gen -b <branch> "feature"  Create branch, then generate
  git gen merge <branches> "instruction"
                                 Combine branches intelligently
  git gen .                      Generate from .gitgen.md spec
  git gen diff .                 Preview spec generation
  git gen init <file>            Create spec from existing file

Options:
  -b <branch>                    Create/switch to branch before generating
  --dry-run                      Show plan without making changes
  --prompt "instructions"        Add custom instructions to any command

Examples:
  git gen learn                  Learn project patterns
  git gen "add dark mode"        Generate on current branch
  git gen -b feature/auth "add auth"
                                 Create branch + generate
  git gen merge feature/a feature/b "pick cleaner impl"
                                 Select best from branches

Environment (pick one):
  ANTHROPIC_API_KEY              Anthropic API key
  OPENROUTER_API_KEY             OpenRouter API key
  AWS_ACCESS_KEY_ID              AWS Bedrock credentials

Provider: ${getProviderDescription()}
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  // Parse global options
  let branch: string | undefined;
  let dryRun = false;
  let customPrompt: string | undefined;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-b") {
      branch = args[++i];
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--prompt" || arg === "-p") {
      customPrompt = args[++i];
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  const command = positional[0];

  try {
    // Subcommands: init, diff, learn, fork
    if (command === "learn") {
      console.log(`→ Analyzing repository...`);
      const summary = await getRepoSummary();
      console.log(summary);
      console.log(`→ Generating spec...`);
      const spec = await generateProjectSpec(customPrompt);

      // Validate the generated spec
      const validation = validateOutput(spec, { type: "spec" });
      if (!validation.valid) {
        console.error(formatValidationResult(validation, ".gitgen.md"));
      }

      await writeFile(".gitgen.md", spec, "utf-8");
      console.log(`✓ Created .gitgen.md`);
    } else if (command === "merge") {
      // git gen merge branch1 branch2 [branch3...] "instruction"
      // Last positional arg is the instruction, rest are branches
      const mergeArgs = positional.slice(1);
      if (mergeArgs.length < 3) {
        console.error("Error: merge requires at least 2 branches and an instruction");
        console.error("Usage: git gen merge <branch1> <branch2> [branch3...] \"instruction\"");
        process.exit(1);
      }

      const instruction = mergeArgs[mergeArgs.length - 1];
      const branches = mergeArgs.slice(0, -1);

      await mergeBranches(branches, instruction, { dryRun });
    } else if (command === "test") {
      const unit = args.includes("--unit");
      const e2e = args.includes("--e2e");
      const cli = args.includes("--cli");
      const web = args.includes("--web");
      const workflow = args.includes("--workflow");

      if (workflow) {
        // Check if workflow already exists
        const workflowPath = ".github/workflows/test.yml";
        if (existsSync(workflowPath)) {
          console.log(`→ Workflow already exists at ${workflowPath}`);
        } else {
          console.log(`→ Creating test workflow...`);
          console.log(`  Copy from: https://github.com/gitgen/gitgen/blob/main/.github/workflows/test.yml`);
        }
        return;
      }

      // Determine which tests to run
      const testCommands: string[] = [];

      if (unit || (!e2e && !cli && !web)) {
        testCommands.push("npm run test:unit");
      }
      if (e2e || cli) {
        testCommands.push("npm run test:e2e:cli");
      }
      if (e2e || web) {
        testCommands.push("npm run test:e2e:web");
      }

      for (const cmd of testCommands) {
        console.log(`→ Running: ${cmd}`);
        try {
          execSync(cmd, { stdio: "inherit" });
        } catch {
          console.error(`✗ Test command failed: ${cmd}`);
          process.exit(1);
        }
      }
      console.log(`\n✓ All tests passed`);
    } else if (command === "init") {
      const filePath = positional[1];
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
      const spec = await generateSpec(filePath, customPrompt);
      const specPath = filePath.replace(/(\.[^.]+)?$/, ".gitgen.md");
      await writeFile(specPath, spec, "utf-8");
      console.log(`✓ Wrote ${specPath}`);
    } else if (command === "diff") {
      const pathArg = positional[1];
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
      const generated = await generate(parsed, customPrompt);

      let existing = "";
      try {
        existing = await readFile(outputPath, "utf-8");
      } catch {
        console.log(`  (new file)`);
      }
      showDiff(existing, generated, relative(process.cwd(), outputPath));
    } else if (command && (command.endsWith(".gitgen.md") || command === "." || existsSync(join(command, ".gitgen.md")))) {
      // Spec-based generation: git gen . or git gen <spec>
      const specPath = resolveSpecPath(command);
      const content = await readFile(specPath, "utf-8");
      const parsed = parseSpec(content, specPath);
      const specDir = dirname(parsed.filePath);
      const outputPath = parsed.spec.output.startsWith("/")
        ? parsed.spec.output
        : resolve(specDir, parsed.spec.output);

      console.log(`→ Generating: ${relative(process.cwd(), outputPath)}`);
      const generated = await generate(parsed, customPrompt);
      await writeFile(outputPath, generated, "utf-8");
      console.log(`✓ Wrote ${relative(process.cwd(), outputPath)}`);
    } else {
      // Feature generation: git gen "feature description"
      const feature = positional.join(" ");
      if (!feature) {
        console.error("Error: No feature description provided");
        process.exit(1);
      }

      console.log(`→ Planning: ${feature}`);
      const files = await generateFeature(feature, { branch, dryRun, prompt: customPrompt });

      if (dryRun) {
        console.log(`\n(dry run - no changes made)`);
      } else {
        console.log(`\n✓ Created ${files.length} files`);
      }
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
