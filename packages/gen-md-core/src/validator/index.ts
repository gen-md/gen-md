import * as fs from "node:fs/promises";
import * as path from "node:path";
import { GenMdParser } from "../parser/index.js";
import { CascadingResolver } from "../resolver/index.js";
import type { GenMdFile, CascadeOptions } from "../types/index.js";

/**
 * Validation result for a single .gen.md file
 */
export interface ValidationResult {
  /** Path to the .gen.md file */
  genMdPath: string;

  /** Path to the output file */
  outputPath: string;

  /** Whether validation passed */
  passed: boolean;

  /** Validation errors if any */
  errors: ValidationError[];

  /** Validation warnings if any */
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  type: "missing_output" | "content_mismatch" | "invalid_gen_md" | "missing_context" | "missing_skill";
  message: string;
  details?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  type: "stale_output" | "unused_context" | "empty_body";
  message: string;
  details?: string;
}

/**
 * Options for validation
 */
export interface ValidateOptions {
  /** Cascade options for resolution */
  cascade?: CascadeOptions;

  /** Check if output file exists */
  checkOutputExists?: boolean;

  /** Check if context files exist */
  checkContextExists?: boolean;

  /** Check if skill files exist */
  checkSkillsExist?: boolean;

  /** Compare output content hash */
  checkContentHash?: boolean;

  /** Expected content hash (for alignment check) */
  expectedHash?: string;
}

/**
 * Validator for .gen.md files
 *
 * Validates that:
 * 1. The .gen.md file is valid
 * 2. The output file exists
 * 3. Referenced context files exist
 * 4. Referenced skill files exist
 * 5. Generated output matches expected (alignment check)
 */
export class Validator {
  private parser: GenMdParser;
  private resolver: CascadingResolver;
  private options: Required<ValidateOptions>;

  constructor(options: ValidateOptions = {}) {
    this.parser = new GenMdParser();
    this.resolver = new CascadingResolver(options.cascade);
    this.options = {
      cascade: options.cascade ?? {},
      checkOutputExists: options.checkOutputExists ?? true,
      checkContextExists: options.checkContextExists ?? true,
      checkSkillsExist: options.checkSkillsExist ?? true,
      checkContentHash: options.checkContentHash ?? false,
      expectedHash: options.expectedHash ?? "",
    };
  }

  /**
   * Validate a single .gen.md file
   */
  async validate(genMdPath: string): Promise<ValidationResult> {
    const absolutePath = path.resolve(genMdPath);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    let genMdFile: GenMdFile;
    let outputPath = "";

    // Parse the .gen.md file
    try {
      genMdFile = await this.parser.parse(absolutePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        type: "invalid_gen_md",
        message: `Failed to parse .gen.md file: ${message}`,
      });
      return {
        genMdPath: absolutePath,
        outputPath: "",
        passed: false,
        errors,
        warnings,
      };
    }

    // Determine output path
    const genMdDir = path.dirname(absolutePath);
    if (genMdFile.frontmatter.output) {
      outputPath = path.resolve(genMdDir, genMdFile.frontmatter.output);
    } else {
      // Infer output from .gen.md filename
      const basename = path.basename(absolutePath);
      if (basename.endsWith(".gen.md")) {
        outputPath = path.resolve(genMdDir, basename.replace(".gen.md", ""));
      }
    }

    // Check if output file exists
    if (this.options.checkOutputExists && outputPath) {
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        errors.push({
          type: "missing_output",
          message: `Output file does not exist: ${outputPath}`,
        });
      }
    }

    // Check if context files exist
    if (this.options.checkContextExists && genMdFile.frontmatter.context) {
      for (const contextPath of genMdFile.frontmatter.context) {
        const absoluteContextPath = path.isAbsolute(contextPath)
          ? contextPath
          : path.resolve(genMdDir, contextPath);

        const exists = await this.fileExists(absoluteContextPath);
        if (!exists) {
          errors.push({
            type: "missing_context",
            message: `Context file does not exist: ${contextPath}`,
            details: `Resolved path: ${absoluteContextPath}`,
          });
        }
      }
    }

    // Check if skill files exist
    if (this.options.checkSkillsExist && genMdFile.frontmatter.skills) {
      for (const skillPath of genMdFile.frontmatter.skills) {
        // Skip non-path skills (could be skill names)
        if (!skillPath.includes("/") && !skillPath.includes("\\")) {
          continue;
        }

        const absoluteSkillPath = path.isAbsolute(skillPath)
          ? skillPath
          : path.resolve(genMdDir, skillPath);

        const exists = await this.fileExists(absoluteSkillPath);
        if (!exists) {
          errors.push({
            type: "missing_skill",
            message: `Skill file does not exist: ${skillPath}`,
            details: `Resolved path: ${absoluteSkillPath}`,
          });
        }
      }
    }

    // Check for empty body
    if (!genMdFile.body.trim()) {
      warnings.push({
        type: "empty_body",
        message: "Generator has no body content",
      });
    }

    // Check content hash for alignment
    if (this.options.checkContentHash && this.options.expectedHash && outputPath) {
      const outputExists = await this.fileExists(outputPath);
      if (outputExists) {
        const actualHash = await this.computeHash(outputPath);
        if (actualHash !== this.options.expectedHash) {
          errors.push({
            type: "content_mismatch",
            message: "Output content does not match expected hash",
            details: `Expected: ${this.options.expectedHash}, Actual: ${actualHash}`,
          });
        }
      }
    }

    return {
      genMdPath: absolutePath,
      outputPath,
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple .gen.md files
   */
  async validateAll(genMdPaths: string[]): Promise<ValidationResult[]> {
    return Promise.all(genMdPaths.map((p) => this.validate(p)));
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Compute a simple hash of file content for comparison
   */
  private async computeHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, "utf-8");
    // Simple hash for demonstration - in production use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}

/**
 * Format validation results for console output
 */
export function formatValidationResults(results: ValidationResult[]): string {
  const lines: string[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const result of results) {
    if (result.passed) {
      passedCount++;
      lines.push(`✓ ${result.genMdPath}`);
    } else {
      failedCount++;
      lines.push(`✗ ${result.genMdPath}`);
      for (const error of result.errors) {
        lines.push(`  ERROR: ${error.message}`);
        if (error.details) {
          lines.push(`         ${error.details}`);
        }
      }
    }

    for (const warning of result.warnings) {
      lines.push(`  WARNING: ${warning.message}`);
    }
  }

  lines.push("");
  lines.push(`Results: ${passedCount} passed, ${failedCount} failed`);

  return lines.join("\n");
}

// Export factory function
export function createValidator(options?: ValidateOptions): Validator {
  return new Validator(options);
}
