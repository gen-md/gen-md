#!/usr/bin/env npx tsx
/**
 * gitgen - Minimal bridge between git and LLM, and vice versa
 *
 * Parse .gitgen.md specs → Read context → Generate content → Write output
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, join } from "node:path";
import { existsSync } from "node:fs";
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

  // Normalize context to array
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

// === GENERATE ===

async function generate(parsed: ParsedSpec): Promise<string> {
  const client = new Anthropic();
  const specDir = dirname(parsed.filePath);

  // Build context section
  let contextSection = "";
  if (parsed.spec.context?.length) {
    const context = await readContext(parsed.spec.context, specDir);
    contextSection = `\n<context>\n${context}\n</context>\n`;
  }

  // Build prompt
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

  // Extract text content
  const content = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Strip any markdown code fences if model added them
  return stripCodeFences(content);
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

  // Simple line-by-line diff
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
  // If it's a .gitgen.md file, use it directly
  if (pathArg.endsWith(".gitgen.md")) {
    if (!existsSync(pathArg)) {
      throw new Error(`File not found: ${pathArg}`);
    }
    return pathArg;
  }

  // If it's a directory, look for .gitgen.md inside
  const dirSpec = join(pathArg, ".gitgen.md");
  if (existsSync(dirSpec)) {
    return dirSpec;
  }

  // Check if target itself exists as a file (without .gitgen.md extension)
  if (existsSync(pathArg) && !pathArg.includes("/") && !pathArg.includes("\\")) {
    throw new Error(`Not a .gitgen.md file: ${pathArg}`);
  }

  throw new Error(`No .gitgen.md found in ${pathArg === "." ? "current directory" : pathArg}`);
}

// === CLI ===

function printUsage(): void {
  console.log(`gitgen - Minimal bridge between git and LLM

Usage:
  gitgen .                      Generate from .gitgen.md in current directory
  gitgen <dir>                  Generate from .gitgen.md in directory
  gitgen <spec.gitgen.md>       Generate from specific spec file
  gitgen diff <dir|spec>        Preview generated content (diff)
  gitgen --help                 Show this help

Examples:
  gitgen .                      Uses ./.gitgen.md
  gitgen src/                   Uses src/.gitgen.md
  gitgen README.gitgen.md       Uses README.gitgen.md directly

Spec format (.gitgen.md):
  ---
  output: README.md
  context:
    - ./package.json
    - ./src/index.ts
  model: claude-sonnet-4-20250514
  ---

  Generate a README with project overview and usage examples.

Environment:
  ANTHROPIC_API_KEY  Required for generation
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const isDiff = args[0] === "diff";
  const pathArg = isDiff ? args[1] : args[0];

  if (!pathArg) {
    console.error("Error: No path provided");
    printUsage();
    process.exit(1);
  }

  try {
    // Resolve spec path (supports directory-level .gitgen.md)
    const specPath = resolveSpecPath(pathArg);

    // Parse spec
    const content = await readFile(specPath, "utf-8");
    const parsed = parseSpec(content, specPath);
    const specDir = dirname(parsed.filePath);
    const outputPath = parsed.spec.output.startsWith("/")
      ? parsed.spec.output
      : resolve(specDir, parsed.spec.output);

    console.log(`Generating ${relative(process.cwd(), outputPath)}...`);

    // Generate content
    const generated = await generate(parsed);

    if (isDiff) {
      // Show diff
      let existing = "";
      try {
        existing = await readFile(outputPath, "utf-8");
      } catch {
        console.log(`(new file)`);
      }
      showDiff(existing, generated, relative(process.cwd(), outputPath));
    } else {
      // Write output
      await writeFile(outputPath, generated, "utf-8");
      console.log(`Wrote ${relative(process.cwd(), outputPath)}`);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
