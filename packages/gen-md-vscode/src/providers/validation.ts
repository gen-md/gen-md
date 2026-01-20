import * as vscode from "vscode";
import { Validator } from "@gen-md/core";

export class GenMdValidationProvider implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private validator: Validator;

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("gen-md");
    this.validator = new Validator();
  }

  async validateDocument(document: vscode.TextDocument): Promise<void> {
    if (!document.fileName.endsWith(".gen.md")) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const result = await this.validator.validate(document.uri.fsPath);

      for (const error of result.errors) {
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          error.message,
          vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = "gen-md";
        diagnostics.push(diagnostic);
      }

      for (const warning of result.warnings) {
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          warning.message,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.source = "gen-md";
        diagnostics.push(diagnostic);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `Parse error: ${message}`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = "gen-md";
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  dispose() {
    this.diagnosticCollection.dispose();
  }
}
