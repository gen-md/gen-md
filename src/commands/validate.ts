/**
 * Validate Command
 *
 * Validates .gitgen.md specs without making API calls.
 * Checks for common issues like missing context files, invalid frontmatter, etc.
 */

import { access, constants, readFile, stat } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import chalk from "chalk";
import { createParser } from "../core/parser.js";
import { createResolver } from "../core/resolver.js";
import { createStore, findGenMdRoot } from "../core/store.js";

/**
 * Options for validate command
 */
export interface ValidateOptions {
  /** Path to validate (single spec or directory) */
  path?: string;
  /** Fix issues that can be auto-fixed */
  fix?: boolean;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Validation issue severity
 */
export type IssueSeverity = "error" | "warning" | "info";

/**
 * A validation issue
 */
export interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  specPath: string;
  field?: string;
  suggestion?: string;
}

/**
 * Result of validate command
 */
export interface ValidateResult {
  /** Number of specs validated */
  specsChecked: number;
  /** Number of errors */
  errors: number;
  /** Number of warnings */
  warnings: number;
  /** All issues found */
  issues: ValidationIssue[];
  /** Specs that passed validation */
  validSpecs: string[];
}

/**
 * Execute validate command
 */
export async function validateCommand(
  options: ValidateOptions = {}
): Promise<ValidateResult> {
  const targetPath = resolve(options.path || process.cwd());

  // Find gitgen root
  const root = await findGenMdRoot(targetPath);
  if (!root) {
    throw new Error(
      "Not a gitgen repository. Run 'gitgen init' to initialize."
    );
  }

  const store = createStore(root);
  const parser = createParser();
  const resolver = createResolver();

  // Find specs to validate
  let specPaths: string[];

  try {
    const targetStat = await stat(targetPath);
    if (targetStat.isDirectory()) {
      specPaths = await store.findAllSpecs();
    } else if (targetPath.endsWith(".gitgen.md")) {
      specPaths = [targetPath];
    } else {
      throw new Error(`${targetPath} is not a .gitgen.md file or directory`);
    }
  } catch {
    specPaths = await store.findAllSpecs();
  }

  const issues: ValidationIssue[] = [];
  const validSpecs: string[] = [];

  for (const specPath of specPaths) {
    const specIssues = await validateSpec(specPath, root, parser, resolver);
    issues.push(...specIssues);

    if (specIssues.filter((i) => i.severity === "error").length === 0) {
      validSpecs.push(specPath);
    }
  }

  return {
    specsChecked: specPaths.length,
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    issues,
    validSpecs,
  };
}

/**
 * Validate a single spec
 */
async function validateSpec(
  specPath: string,
  root: string,
  parser: ReturnType<typeof createParser>,
  resolver: ReturnType<typeof createResolver>
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const relPath = relative(root, specPath);

  // Try to parse the spec
  let parsed;
  try {
    parsed = await parser.parse(specPath);
  } catch (error) {
    issues.push({
      severity: "error",
      message: `Failed to parse: ${(error as Error).message}`,
      specPath: relPath,
    });
    return issues;
  }

  const resolved = parser.resolveRelativePaths(parsed);
  const fm = resolved.frontmatter;

  // Check required fields
  if (!fm.name) {
    issues.push({
      severity: "warning",
      message: "Missing 'name' field in frontmatter",
      specPath: relPath,
      field: "name",
      suggestion: "Add a name to help identify this spec",
    });
  }

  if (!fm.output) {
    issues.push({
      severity: "error",
      message: "Missing 'output' field - spec has no target file",
      specPath: relPath,
      field: "output",
      suggestion: "Add 'output: path/to/file' to frontmatter",
    });
  }

  // Check context files exist
  const contextPaths = fm.context || [];
  for (const contextPath of contextPaths) {
    try {
      await access(contextPath, constants.R_OK);
    } catch {
      issues.push({
        severity: "error",
        message: `Context file not found: ${contextPath}`,
        specPath: relPath,
        field: "context",
        suggestion: `Create the file or remove it from context`,
      });
    }
  }

  // Check skills files exist
  const skillsPaths = fm.skills || [];
  for (const skillPath of skillsPaths) {
    try {
      await access(skillPath, constants.R_OK);
    } catch {
      issues.push({
        severity: "error",
        message: `Skill file not found: ${skillPath}`,
        specPath: relPath,
        field: "skills",
        suggestion: `Create the file or remove it from skills`,
      });
    }
  }

  // Check body content
  if (!resolved.body.trim()) {
    issues.push({
      severity: "warning",
      message: "Empty body - no generation instructions provided",
      specPath: relPath,
      suggestion: "Add instructions describing what to generate",
    });
  }

  // Check body length (too short might not be useful)
  const wordCount = resolved.body.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5 && wordCount > 0) {
    issues.push({
      severity: "info",
      message: `Very short body (${wordCount} words) - consider adding more details`,
      specPath: relPath,
    });
  }

  // Check for potentially problematic patterns
  if (resolved.body.includes("TODO")) {
    issues.push({
      severity: "info",
      message: "Body contains TODO marker",
      specPath: relPath,
    });
  }

  // Validate examples
  for (let i = 0; i < parsed.examples.length; i++) {
    const example = parsed.examples[i];
    if (!example.input) {
      issues.push({
        severity: "warning",
        message: `Example ${i + 1} has empty input`,
        specPath: relPath,
        field: "examples",
      });
    }
    if (!example.output) {
      issues.push({
        severity: "warning",
        message: `Example ${i + 1} has empty output`,
        specPath: relPath,
        field: "examples",
      });
    }
  }

  // Check for cascade conflicts
  try {
    const fullResolved = await resolver.resolve(specPath);
    if (fullResolved.chain.length > 5) {
      issues.push({
        severity: "info",
        message: `Deep cascade chain (${fullResolved.chain.length} levels) - may be hard to debug`,
        specPath: relPath,
      });
    }
  } catch {
    // Cascade resolution failed
  }

  // Check output path is reasonable
  if (fm.output) {
    const outputExt = fm.output.split(".").pop()?.toLowerCase();
    const suspiciousExts = ["exe", "dll", "so", "bin", "sh", "bash"];
    if (outputExt && suspiciousExts.includes(outputExt)) {
      issues.push({
        severity: "warning",
        message: `Output extension '${outputExt}' is unusual for generated content`,
        specPath: relPath,
        field: "output",
      });
    }
  }

  return issues;
}

/**
 * Format validate result for display
 */
export function formatValidate(result: ValidateResult): string {
  const lines: string[] = [];

  if (result.issues.length === 0) {
    lines.push(chalk.green(`✓ All ${result.specsChecked} specs are valid\n`));
    return lines.join("\n");
  }

  // Group by spec
  const bySpec = new Map<string, ValidationIssue[]>();
  for (const issue of result.issues) {
    const existing = bySpec.get(issue.specPath) || [];
    existing.push(issue);
    bySpec.set(issue.specPath, existing);
  }

  for (const [specPath, issues] of bySpec) {
    lines.push(chalk.bold(specPath));

    for (const issue of issues) {
      const icon =
        issue.severity === "error" ? chalk.red("✗") :
        issue.severity === "warning" ? chalk.yellow("⚠") :
        chalk.blue("ℹ");

      lines.push(`  ${icon} ${issue.message}`);
      if (issue.suggestion) {
        lines.push(chalk.gray(`    └─ ${issue.suggestion}`));
      }
    }
    lines.push("");
  }

  // Summary
  lines.push(chalk.bold("Summary:"));
  lines.push(
    `  ${result.specsChecked} specs checked, ` +
    chalk.green(`${result.validSpecs.length} valid`) + ", " +
    (result.errors > 0 ? chalk.red(`${result.errors} errors`) : "0 errors") + ", " +
    (result.warnings > 0 ? chalk.yellow(`${result.warnings} warnings`) : "0 warnings")
  );

  return lines.join("\n");
}
