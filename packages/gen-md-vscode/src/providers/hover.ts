import * as vscode from "vscode";
import { CascadingResolver } from "@gen-md/core";

export class GenMdHoverProvider implements vscode.HoverProvider {
  private resolver: CascadingResolver;

  constructor() {
    this.resolver = new CascadingResolver();
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    const config = vscode.workspace.getConfiguration("gen-md");
    if (!config.get("showCascadeOnHover")) {
      return null;
    }

    // Only show hover at the start of the file (frontmatter area)
    if (position.line > 20) {
      return null;
    }

    try {
      const resolved = await this.resolver.resolve(document.uri.fsPath);

      const markdown = new vscode.MarkdownString();
      markdown.isTrusted = true;

      markdown.appendMarkdown("### gen-md Cascade Chain\n\n");

      resolved.chain.forEach((f, i) => {
        const filename = f.filePath.split("/").pop();
        markdown.appendMarkdown(`${i + 1}. \`${filename}\`\n`);
      });

      markdown.appendMarkdown("\n---\n\n");
      markdown.appendMarkdown("**Merged Configuration:**\n\n");

      if (resolved.frontmatter.skills?.length) {
        markdown.appendMarkdown(
          `- **Skills:** ${resolved.frontmatter.skills.length} skill(s)\n`
        );
      }

      if (resolved.frontmatter.context?.length) {
        markdown.appendMarkdown(
          `- **Context:** ${resolved.frontmatter.context.length} file(s)\n`
        );
      }

      if (resolved.frontmatter.output) {
        markdown.appendMarkdown(
          `- **Output:** \`${resolved.frontmatter.output}\`\n`
        );
      }

      markdown.appendMarkdown(
        "\n[Show Full Cascade](command:gen-md.showCascade)"
      );

      return new vscode.Hover(markdown);
    } catch {
      return null;
    }
  }
}
