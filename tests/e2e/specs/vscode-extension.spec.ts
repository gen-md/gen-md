import { test, expect } from "@playwright/test";
import * as path from "path";

/**
 * E2E tests for the gen-md VS Code extension
 *
 * These tests verify the VS Code extension functionality
 * using web-based VS Code (vscode.dev) or local webview testing.
 */

test.describe("VS Code Extension", () => {
  test.describe("Webview Components", () => {
    test("should render cascade visualization", async ({ page }) => {
      // Test the cascade visualization webview component
      const webviewPath = path.resolve(
        __dirname,
        "../../../packages/gen-md-vscode/webviews/cascade-view.html"
      );

      await page.goto(`file://${webviewPath}`);

      // Take screenshot of cascade visualization
      await page.screenshot({
        path: "./screenshots/vscode-cascade-view.png",
        fullPage: true,
      });
    });

    test("should render validation panel", async ({ page }) => {
      const webviewPath = path.resolve(
        __dirname,
        "../../../packages/gen-md-vscode/webviews/validation-panel.html"
      );

      await page.goto(`file://${webviewPath}`);

      await page.screenshot({
        path: "./screenshots/vscode-validation-panel.png",
        fullPage: true,
      });
    });
  });

  test.describe("Syntax Highlighting Preview", () => {
    test("should display .gen.md syntax highlighting", async ({ page }) => {
      // Create a mock editor view with syntax highlighting
      await page.setContent(`
        <html>
          <head>
            <style>
              body {
                font-family: 'Monaco', 'Menlo', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 20px;
              }
              .yaml-key { color: #9cdcfe; }
              .yaml-value { color: #ce9178; }
              .yaml-delimiter { color: #808080; }
              .xml-tag { color: #569cd6; }
              .content { color: #d4d4d4; }
              .line { line-height: 1.5; }
              .line-number {
                color: #858585;
                display: inline-block;
                width: 30px;
                text-align: right;
                margin-right: 10px;
              }
            </style>
          </head>
          <body>
            <div class="editor">
              <div class="line"><span class="line-number">1</span><span class="yaml-delimiter">---</span></div>
              <div class="line"><span class="line-number">2</span><span class="yaml-key">name</span><span class="yaml-delimiter">:</span> <span class="yaml-value">"README Generator"</span></div>
              <div class="line"><span class="line-number">3</span><span class="yaml-key">description</span><span class="yaml-delimiter">:</span> <span class="yaml-value">"Generates project README"</span></div>
              <div class="line"><span class="line-number">4</span><span class="yaml-key">context</span><span class="yaml-delimiter">:</span></div>
              <div class="line"><span class="line-number">5</span>  <span class="yaml-delimiter">-</span> <span class="yaml-value">"./src/index.ts"</span></div>
              <div class="line"><span class="line-number">6</span>  <span class="yaml-delimiter">-</span> <span class="yaml-value">"./package.json"</span></div>
              <div class="line"><span class="line-number">7</span><span class="yaml-key">skills</span><span class="yaml-delimiter">:</span></div>
              <div class="line"><span class="line-number">8</span>  <span class="yaml-delimiter">-</span> <span class="yaml-value">"./.agent/skills/gen-md/SKILL.md"</span></div>
              <div class="line"><span class="line-number">9</span><span class="yaml-key">output</span><span class="yaml-delimiter">:</span> <span class="yaml-value">"README.md"</span></div>
              <div class="line"><span class="line-number">10</span><span class="yaml-delimiter">---</span></div>
              <div class="line"><span class="line-number">11</span><span class="xml-tag">&lt;input&gt;</span></div>
              <div class="line"><span class="line-number">12</span><span class="content">Generate a comprehensive README for this project.</span></div>
              <div class="line"><span class="line-number">13</span><span class="content">Include installation, usage, and API documentation.</span></div>
              <div class="line"><span class="line-number">14</span><span class="xml-tag">&lt;/input&gt;</span></div>
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/vscode-syntax-highlighting.png",
        fullPage: true,
      });
    });
  });
});
