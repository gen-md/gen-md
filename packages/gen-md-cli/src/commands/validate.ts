import { Command } from "commander";
import {
  createValidator,
  formatValidationResults,
  createGitExtractor,
  formatGitContextForPrompt,
} from "@gen-md/core";

export const validateCommand = new Command("validate")
  .description("Validate .gen.md files and check if outputs exist")
  .argument("<files...>", "Input .gen.md files to validate")
  .option("--no-check-output", "Skip checking if output files exist")
  .option("--no-check-context", "Skip checking if context files exist")
  .option("--no-check-skills", "Skip checking if skill files exist")
  .option("--json", "Output results as JSON", false)
  .option("--prompt", "Output as conversational prompt", false)
  .option("--git", "Include git context", false)
  .action(async (files: string[], options) => {
    const validator = createValidator({
      checkOutputExists: options.checkOutput !== false,
      checkContextExists: options.checkContext !== false,
      checkSkillsExist: options.checkSkills !== false,
    });

    try {
      const results = await validator.validateAll(files);

      // Git context
      let gitContext = null;
      if (options.git && files.length > 0) {
        const gitExtractor = createGitExtractor();
        try {
          gitContext = await gitExtractor.extract(files[0]);
        } catch {
          // Not a git repository or git not available
        }
      }

      // Prompt output mode
      if (options.prompt) {
        const parts: string[] = [];

        parts.push("## Validation Report");
        parts.push("");

        const passed = results.filter((r) => r.passed);
        const failed = results.filter((r) => !r.passed);

        parts.push(
          `### Summary: ${passed.length} passed, ${failed.length} failed`
        );
        parts.push("");

        if (failed.length > 0) {
          parts.push("### Issues Found:");
          for (const result of failed) {
            parts.push(`\n**${result.genMdPath}**`);
            for (const error of result.errors) {
              parts.push(`- ERROR: ${error.message}`);
            }
            for (const warning of result.warnings) {
              parts.push(`- WARNING: ${warning.message}`);
            }
          }
        }

        if (passed.length > 0) {
          parts.push("\n### Passed:");
          for (const result of passed) {
            parts.push(`- ${result.genMdPath}`);
          }
        }

        if (gitContext) {
          parts.push("");
          parts.push(formatGitContextForPrompt(gitContext));
        }

        console.log(parts.join("\n"));

        const hasFailed = results.some((r) => !r.passed);
        if (hasFailed) {
          process.exit(1);
        }
        return;
      }

      if (options.json) {
        const output = {
          results,
          gitContext: options.git ? gitContext : undefined,
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(formatValidationResults(results));

        if (gitContext) {
          console.log("\nGit Context:");
          console.log(`  Branch: ${gitContext.branch}`);
          console.log(`  Recent commits: ${gitContext.commits.length}`);
        }
      }

      // Exit with error code if any validation failed
      const hasFailed = results.some((r) => !r.passed);
      if (hasFailed) {
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Validation failed:", message);
      process.exit(1);
    }
  });
