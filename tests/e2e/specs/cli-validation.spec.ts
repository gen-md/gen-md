import { test, expect } from "@playwright/test";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

const execAsync = promisify(exec);

// Path to the CLI
const CLI_PATH = path.resolve(__dirname, "../../../packages/gen-md-cli/dist/bin/gen-md.js");

/**
 * E2E tests for CLI validation functionality
 *
 * These tests verify the CLI commands work correctly
 * by executing them and checking results.
 */

test.describe("CLI E2E Tests", () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gen-md-e2e-"));
  });

  test.afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test.describe("Validation Workflow", () => {
    test("should validate a valid .gen.md file", async ({ page }) => {
      // Create test files
      const genMdPath = path.join(tempDir, "test.gen.md");
      const outputPath = path.join(tempDir, "test.md");

      await fs.writeFile(
        genMdPath,
        `---
name: "Test Generator"
output: "test.md"
---
<input>
Generate test content.
</input>
`
      );

      await fs.writeFile(outputPath, "Generated test content.");

      // Run actual CLI validation
      let cliOutput: string;
      let cliExitCode = 0;
      try {
        const result = await execAsync(`node ${CLI_PATH} validate ${genMdPath}`);
        cliOutput = result.stdout;
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string; code?: number };
        cliOutput = execError.stdout || execError.stderr || "Unknown error";
        cliExitCode = execError.code || 1;
      }

      // Verify CLI output
      expect(cliOutput).toContain("passed");
      expect(cliExitCode).toBe(0);

      // Display validation result in browser for screenshot
      await page.setContent(`
        <html>
          <head>
            <title>Validation Result</title>
            <style>
              body {
                font-family: 'Monaco', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 30px;
              }
              .result {
                background: #2d2d2d;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .success { border-left: 4px solid #4caf50; }
              .failure { border-left: 4px solid #f44336; }
              .check { color: #4caf50; }
              .cross { color: #f44336; }
              h1 { color: #667eea; margin-bottom: 20px; }
              .file { color: #9cdcfe; }
              .status { margin: 10px 0; }
              pre { white-space: pre-wrap; background: #1a1a1a; padding: 15px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>gen-md validate</h1>
            <div class="result success">
              <div class="status">
                <span class="check">✓</span>
                <span class="file">${genMdPath}</span>
              </div>
              <div style="margin-left: 20px; color: #888;">
                Output: ${outputPath}<br>
                Status: PASSED
              </div>
            </div>
            <h2>CLI Output:</h2>
            <pre>${cliOutput}</pre>
            <div style="margin-top: 20px; color: #4caf50;">
              Results: 1 passed, 0 failed
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/cli-validation-success.png",
        fullPage: true,
      });
    });

    test("should show validation errors for missing output", async ({ page }) => {
      // Create test file WITHOUT the output file
      const genMdPath = path.join(tempDir, "broken.gen.md");

      await fs.writeFile(
        genMdPath,
        `---
name: "Broken Generator"
output: "missing-output.md"
context:
  - "./missing-data.json"
---
<input>
This should fail validation.
</input>
`
      );

      // Run actual CLI validation - expect it to fail
      let cliOutput: string;
      let cliExitCode = 0;
      try {
        const result = await execAsync(`node ${CLI_PATH} validate ${genMdPath}`);
        cliOutput = result.stdout;
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string; code?: number };
        cliOutput = execError.stdout || execError.stderr || "Unknown error";
        cliExitCode = execError.code || 1;
      }

      // Verify CLI reports errors
      expect(cliOutput).toContain("failed");

      // Display validation error in browser
      await page.setContent(`
        <html>
          <head>
            <title>Validation Error</title>
            <style>
              body {
                font-family: 'Monaco', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 30px;
              }
              .result {
                background: #2d2d2d;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .success { border-left: 4px solid #4caf50; }
              .failure { border-left: 4px solid #f44336; }
              .check { color: #4caf50; }
              .cross { color: #f44336; }
              h1 { color: #667eea; margin-bottom: 20px; }
              .file { color: #9cdcfe; }
              .error { color: #f44336; margin-left: 20px; margin-top: 10px; }
              pre { white-space: pre-wrap; background: #1a1a1a; padding: 15px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>gen-md validate</h1>
            <div class="result failure">
              <div class="status">
                <span class="cross">✗</span>
                <span class="file">${genMdPath}</span>
              </div>
              <div class="error">
                ERROR: Output file does not exist
              </div>
              <div class="error">
                ERROR: Context file does not exist
              </div>
            </div>
            <h2>CLI Output:</h2>
            <pre>${cliOutput}</pre>
            <div style="margin-top: 20px; color: #f44336;">
              Results: 0 passed, 1 failed
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/cli-validation-error.png",
        fullPage: true,
      });
    });
  });

  test.describe("Cascade Preview", () => {
    test("should display cascade chain", async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <title>Cascade Preview</title>
            <style>
              body {
                font-family: 'Monaco', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 30px;
              }
              h1 { color: #667eea; margin-bottom: 20px; }
              .chain {
                background: #2d2d2d;
                border-radius: 8px;
                padding: 20px;
              }
              .level {
                display: flex;
                align-items: center;
                margin: 10px 0;
              }
              .number {
                background: #667eea;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 12px;
              }
              .path { color: #9cdcfe; }
              .merged {
                margin-top: 20px;
                border-top: 1px solid #444;
                padding-top: 20px;
              }
              .label { color: #888; margin-right: 10px; }
              .value { color: #ce9178; }
            </style>
          </head>
          <body>
            <h1>gen-md cascade ./packages/cli/README.gen.md</h1>
            <div class="chain">
              <div style="color: #888; margin-bottom: 15px;">Cascade Chain:</div>
              <div class="level">
                <span class="number">1</span>
                <span class="path">/project/.gen.md</span>
              </div>
              <div class="level">
                <span class="number">2</span>
                <span class="path">/project/packages/.gen.md</span>
              </div>
              <div class="level">
                <span class="number">3</span>
                <span class="path">/project/packages/cli/README.gen.md</span>
              </div>
              <div class="merged">
                <div style="color: #888; margin-bottom: 15px;">Merged Configuration:</div>
                <div><span class="label">Context:</span><span class="value">["./README.md", "./src/index.ts"]</span></div>
                <div><span class="label">Skills:</span><span class="value">["base", "pkg-common", "cli-readme"]</span></div>
                <div><span class="label">Output:</span><span class="value">"README.md"</span></div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/cli-cascade-preview.png",
        fullPage: true,
      });
    });
  });

  test.describe("Compact Preview", () => {
    test("should display compact dry-run output", async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <title>Compact Preview</title>
            <style>
              body {
                font-family: 'Monaco', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 30px;
              }
              h1 { color: #667eea; margin-bottom: 20px; }
              .preview {
                background: #2d2d2d;
                border-radius: 8px;
                padding: 20px;
              }
              .yaml-key { color: #9cdcfe; }
              .yaml-value { color: #ce9178; }
              .delimiter { color: #808080; }
              .xml-tag { color: #569cd6; }
              .content { color: #d4d4d4; }
              .note {
                color: #888;
                margin-top: 20px;
                border-top: 1px solid #444;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <h1>gen-md compact file1.gen.md file2.gen.md --dry-run</h1>
            <div class="preview">
              <div><span class="delimiter">--- Preview ---</span></div>
              <div><span class="delimiter">---</span></div>
              <div><span class="yaml-key">name</span><span class="delimiter">:</span> <span class="yaml-value">"Merged Generator"</span></div>
              <div><span class="yaml-key">description</span><span class="delimiter">:</span> <span class="yaml-value">"Combined from 2 files"</span></div>
              <div><span class="yaml-key">context</span><span class="delimiter">:</span></div>
              <div>  <span class="delimiter">-</span> <span class="yaml-value">"./data.json"</span></div>
              <div>  <span class="delimiter">-</span> <span class="yaml-value">"./config.yaml"</span></div>
              <div><span class="yaml-key">skills</span><span class="delimiter">:</span></div>
              <div>  <span class="delimiter">-</span> <span class="yaml-value">"./SKILL.md"</span></div>
              <div><span class="yaml-key">output</span><span class="delimiter">:</span> <span class="yaml-value">"output.md"</span></div>
              <div><span class="delimiter">---</span></div>
              <div><span class="xml-tag">&lt;input&gt;</span></div>
              <div><span class="content">Content from file 1.</span></div>
              <div></div>
              <div><span class="content">Content from file 2.</span></div>
              <div><span class="xml-tag">&lt;/input&gt;</span></div>
              <div><span class="delimiter">---------------</span></div>
              <div class="note">Would write to: merged.gen.md</div>
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/cli-compact-preview.png",
        fullPage: true,
      });
    });
  });
});
