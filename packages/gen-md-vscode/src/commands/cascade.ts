import * as vscode from "vscode";
import { CascadingResolver } from "@gen-md/core";

export async function showCascadeCommand(uri?: vscode.Uri) {
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

    // Create webview panel for cascade visualization
    const panel = vscode.window.createWebviewPanel(
      "genMdCascade",
      "Cascade Chain",
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = getCascadeHtml(resolved);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to show cascade: ${message}`);
  }
}

function getCascadeHtml(resolved: any): string {
  const chainHtml = resolved.chain
    .map(
      (f: any, i: number) => `
      <div class="node">
        <div class="node-number">${i + 1}</div>
        <div class="node-path">${f.filePath}</div>
        <div class="node-skills">skills: ${JSON.stringify(f.frontmatter.skills || [])}</div>
      </div>
      ${i < resolved.chain.length - 1 ? '<div class="connector"></div>' : ""}
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
    }
    h1 {
      color: var(--vscode-textLink-foreground);
      margin-bottom: 30px;
    }
    .cascade {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .node {
      background: var(--vscode-editor-selectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 15px 25px;
      min-width: 300px;
      text-align: center;
    }
    .node-number {
      background: var(--vscode-textLink-foreground);
      color: var(--vscode-editor-background);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .node-path {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      opacity: 0.8;
      word-break: break-all;
    }
    .node-skills {
      font-size: 11px;
      margin-top: 8px;
      color: var(--vscode-descriptionForeground);
    }
    .connector {
      width: 2px;
      height: 30px;
      background: var(--vscode-textLink-foreground);
    }
    .merged {
      margin-top: 30px;
      border: 2px solid var(--vscode-textLink-foreground);
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
    }
    .merged h2 {
      margin: 0 0 15px 0;
      color: var(--vscode-textLink-foreground);
    }
    .merged-item {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <h1>Cascade Chain</h1>
  <div class="cascade">
    ${chainHtml}
    <div class="merged">
      <h2>Merged Configuration</h2>
      <div class="merged-item">skills: ${JSON.stringify(resolved.frontmatter.skills || [])}</div>
      <div class="merged-item">context: ${JSON.stringify(resolved.frontmatter.context || [])}</div>
      <div class="merged-item">output: ${JSON.stringify(resolved.frontmatter.output || "N/A")}</div>
    </div>
  </div>
</body>
</html>`;
}
