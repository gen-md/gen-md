import * as vscode from "vscode";
import { generateCommand } from "./generate.js";
import { validateCommand } from "./validate.js";
import { showCascadeCommand } from "./cascade.js";
import { compactCommand } from "./compact.js";

export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("gen-md.generate", generateCommand),
    vscode.commands.registerCommand("gen-md.validate", validateCommand),
    vscode.commands.registerCommand("gen-md.showCascade", showCascadeCommand),
    vscode.commands.registerCommand("gen-md.compact", compactCommand)
  );
}
