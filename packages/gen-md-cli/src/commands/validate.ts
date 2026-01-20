import { Command } from "commander";
import { createValidator, formatValidationResults } from "@gen-md/core";

export const validateCommand = new Command("validate")
  .description("Validate .gen.md files and check if outputs exist")
  .argument("<files...>", "Input .gen.md files to validate")
  .option("--no-check-output", "Skip checking if output files exist")
  .option("--no-check-context", "Skip checking if context files exist")
  .option("--no-check-skills", "Skip checking if skill files exist")
  .option("--json", "Output results as JSON", false)
  .action(async (files: string[], options) => {
    const validator = createValidator({
      checkOutputExists: options.checkOutput !== false,
      checkContextExists: options.checkContext !== false,
      checkSkillsExist: options.checkSkills !== false,
    });

    try {
      const results = await validator.validateAll(files);

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(formatValidationResults(results));
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
