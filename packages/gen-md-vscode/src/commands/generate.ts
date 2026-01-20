import * as vscode from "vscode";
import { CascadingResolver } from "@gen-md/core";

export async function generateCommand(uri?: vscode.Uri) {
  const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

  if (!fileUri) {
    vscode.window.showErrorMessage("No .gen.md file selected");
    return;
  }

  if (!fileUri.fsPath.endsWith(".gen.md")) {
    vscode.window.showErrorMessage("File must be a .gen.md file");
    return;
  }

  try {
    const resolver = new CascadingResolver();
    const resolved = await resolver.resolve(fileUri.fsPath);

    // Show resolved configuration
    const output = vscode.window.createOutputChannel("gen-md");
    output.clear();
    output.appendLine("=== gen-md Generation ===");
    output.appendLine(`File: ${fileUri.fsPath}`);
    output.appendLine(`Output: ${resolved.frontmatter.output || "N/A"}`);
    output.appendLine("");
    output.appendLine("Cascade Chain:");
    resolved.chain.forEach((f, i) => {
      output.appendLine(`  ${i + 1}. ${f.filePath}`);
    });
    output.appendLine("");
    output.appendLine("Merged Skills:");
    resolved.frontmatter.skills?.forEach((s) => {
      output.appendLine(`  - ${s}`);
    });
    output.appendLine("");
    output.appendLine("Body:");
    output.appendLine(resolved.body);
    output.show();

    vscode.window.showInformationMessage(
      `Ready to generate: ${resolved.frontmatter.output}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Generation failed: ${message}`);
  }
}
