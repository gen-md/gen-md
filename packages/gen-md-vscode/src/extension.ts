import * as vscode from "vscode";
import { registerCommands } from "./commands/index.js";
import { GenMdValidationProvider } from "./providers/validation.js";
import { GenMdHoverProvider } from "./providers/hover.js";

export function activate(context: vscode.ExtensionContext) {
  console.log("gen-md extension is now active");

  // Register commands
  registerCommands(context);

  // Register validation provider
  const validationProvider = new GenMdValidationProvider();
  context.subscriptions.push(validationProvider);

  // Register hover provider for cascade information
  const hoverProvider = new GenMdHoverProvider();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: "gen-md", scheme: "file" },
      hoverProvider
    )
  );

  // Validate on save if enabled
  const config = vscode.workspace.getConfiguration("gen-md");
  if (config.get("validateOnSave")) {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.fileName.endsWith(".gen.md")) {
          vscode.commands.executeCommand("gen-md.validate", document.uri);
        }
      })
    );
  }
}

export function deactivate() {
  console.log("gen-md extension is now deactivated");
}
