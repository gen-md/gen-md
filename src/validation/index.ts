export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  type: "file" | "plan" | "spec";
  filePath?: string;
  expectedExtension?: string;
}

/**
 * Validate LLM output based on the expected output type.
 */
export function validateOutput(content: string, options: ValidationOptions): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Common validations
  if (!content || content.trim().length === 0) {
    errors.push("Empty output");
    return { valid: false, errors, warnings };
  }

  // Check for common LLM artifacts that shouldn't be in output
  if (content.includes("```")) {
    warnings.push("Output contains markdown code fences");
  }

  // Check for conversational preamble
  if (/^(Sure|Here|I'll|Let me|Of course|Certainly)/i.test(content.trim())) {
    errors.push("Output contains conversational preamble");
  }

  // Check for explanation suffixes
  if (/\n\n(This|The above|Note:|Explanation:)/i.test(content)) {
    warnings.push("Output may contain explanatory text");
  }

  switch (options.type) {
    case "file":
      return validateFileOutput(content, options, errors, warnings);
    case "plan":
      return validatePlanOutput(content, errors, warnings);
    case "spec":
      return validateSpecOutput(content, errors, warnings);
  }
}

/**
 * Validate generated file content.
 */
function validateFileOutput(
  content: string,
  options: ValidationOptions,
  errors: string[],
  warnings: string[]
): ValidationResult {
  const ext = options.expectedExtension || options.filePath?.split(".").pop();

  // TypeScript/JavaScript specific validations
  if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
    // Check for basic syntax indicators
    if (
      !content.includes("function") &&
      !content.includes("const ") &&
      !content.includes("let ") &&
      !content.includes("class ") &&
      !content.includes("export ") &&
      !content.includes("import ") &&
      !content.includes("=>")
    ) {
      warnings.push("File may not contain valid JavaScript/TypeScript code");
    }

    // Check for unclosed brackets (simple heuristic)
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
    }

    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    }

    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
    }
  }

  // JSON validation
  if (ext === "json") {
    try {
      JSON.parse(content);
    } catch (e) {
      errors.push(`Invalid JSON: ${(e as Error).message}`);
    }
  }

  // YAML validation (basic check)
  if (ext === "yaml" || ext === "yml") {
    // Check for common YAML syntax errors
    if (content.includes("\t")) {
      warnings.push("YAML file contains tabs (should use spaces)");
    }
  }

  // Markdown validation
  if (ext === "md") {
    // Check for unclosed code blocks
    const codeBlocks = (content.match(/```/g) || []).length;
    if (codeBlocks % 2 !== 0) {
      errors.push("Unclosed code block in markdown");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate implementation plan JSON output.
 */
function validatePlanOutput(
  content: string,
  errors: string[],
  warnings: string[]
): ValidationResult {
  // Plan should be valid JSON
  let plan: unknown;
  try {
    plan = JSON.parse(content);
  } catch (e) {
    errors.push(`Plan is not valid JSON: ${(e as Error).message}`);
    return { valid: false, errors, warnings };
  }

  // Type guard
  if (typeof plan !== "object" || plan === null) {
    errors.push('Plan must be an object');
    return { valid: false, errors, warnings };
  }

  const planObj = plan as Record<string, unknown>;

  if (!planObj.files || !Array.isArray(planObj.files)) {
    errors.push('Plan missing "files" array');
  } else {
    for (const file of planObj.files) {
      if (typeof file !== "object" || file === null) {
        errors.push("Plan file entry must be an object");
        continue;
      }
      const fileObj = file as Record<string, unknown>;
      if (!fileObj.path) errors.push('Plan file entry missing "path"');
      if (!fileObj.action) errors.push('Plan file entry missing "action"');
      if (fileObj.action && !["create", "modify"].includes(fileObj.action as string)) {
        warnings.push(`Unknown action: ${fileObj.action}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate .gitgen.md spec output.
 */
function validateSpecOutput(
  content: string,
  errors: string[],
  warnings: string[]
): ValidationResult {
  // Spec should start with YAML frontmatter
  if (!content.startsWith("---")) {
    errors.push("Spec must start with YAML frontmatter (---)");
  }

  // Check for required output field
  if (!content.includes("output:")) {
    errors.push('Spec missing required "output" field');
  }

  // Check for closing frontmatter delimiter
  const frontmatterEnd = content.indexOf("---", 3);
  if (frontmatterEnd === -1) {
    errors.push("Spec missing closing frontmatter delimiter (---)");
  }

  // Check that there's content after frontmatter
  if (frontmatterEnd !== -1) {
    const body = content.slice(frontmatterEnd + 3).trim();
    if (body.length === 0) {
      warnings.push("Spec has no instructions after frontmatter");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Format validation result for display.
 */
export function formatValidationResult(result: ValidationResult, context?: string): string {
  const lines: string[] = [];

  if (context) {
    lines.push(`Validation for ${context}:`);
  }

  if (result.valid) {
    lines.push("  ✓ Valid");
  } else {
    lines.push("  ✗ Invalid");
  }

  for (const error of result.errors) {
    lines.push(`  Error: ${error}`);
  }

  for (const warning of result.warnings) {
    lines.push(`  Warning: ${warning}`);
  }

  return lines.join("\n");
}
