import * as vscode from "vscode";
import * as fs from "node:fs/promises";
import { Compactor, GenMdSerializer } from "@gen-md/core";

export async function compactCommand() {
  // Let user select multiple .gen.md files
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: true,
    filters: { "gen-md files": ["gen.md"] },
    title: "Select .gen.md files to compact",
  });

  if (!uris || uris.length < 2) {
    vscode.window.showErrorMessage("Select at least 2 .gen.md files to compact");
    return;
  }

  // Ask for output file name
  const outputName = await vscode.window.showInputBox({
    prompt: "Output file name",
    value: "merged.gen.md",
    validateInput: (value) => {
      if (!value.endsWith(".gen.md")) {
        return "File must end with .gen.md";
      }
      return null;
    },
  });

  if (!outputName) {
    return;
  }

  try {
    const files = uris.map((u) => u.fsPath);
    const compactor = new Compactor({
      arrayMerge: "dedupe",
      bodyMerge: "append",
      output: outputName,
    });

    const result = await compactor.compact(files);
    const serializer = new GenMdSerializer();
    const content = serializer.serialize(result);

    // Determine output path (same directory as first file)
    const outputPath = vscode.Uri.joinPath(
      vscode.Uri.file(files[0]).with({ path: vscode.Uri.file(files[0]).path.replace(/[^/]+$/, "") }),
      outputName
    );

    await fs.writeFile(outputPath.fsPath, content);

    vscode.window.showInformationMessage(
      `Compacted ${files.length} files into ${outputName}`
    );

    // Open the new file
    const doc = await vscode.workspace.openTextDocument(outputPath);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Compaction failed: ${message}`);
  }
}
