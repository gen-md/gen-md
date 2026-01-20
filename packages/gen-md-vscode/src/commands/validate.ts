import * as vscode from "vscode";
import { Validator, formatValidationResults } from "@gen-md/core";

export async function validateCommand(uri?: vscode.Uri) {
  let files: string[] = [];

  if (uri) {
    files = [uri.fsPath];
  } else {
    // Find all .gen.md files in workspace
    const uris = await vscode.workspace.findFiles("**/*.gen.md");
    files = uris.map((u) => u.fsPath);
  }

  if (files.length === 0) {
    vscode.window.showInformationMessage("No .gen.md files found");
    return;
  }

  try {
    const validator = new Validator();
    const results = await validator.validateAll(files);

    const output = vscode.window.createOutputChannel("gen-md Validation");
    output.clear();
    output.appendLine("=== gen-md Validation Results ===");
    output.appendLine("");
    output.appendLine(formatValidationResults(results));
    output.show();

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    if (failed === 0) {
      vscode.window.showInformationMessage(
        `Validation passed: ${passed} file(s)`
      );
    } else {
      vscode.window.showWarningMessage(
        `Validation: ${passed} passed, ${failed} failed`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Validation failed: ${message}`);
  }
}
