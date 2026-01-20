import { test } from "@playwright/test";

/**
 * E2E tests for the gen-md web demo/documentation site
 *
 * These tests verify the web-based demo functionality
 * and capture screenshots for documentation.
 */

test.describe("Web Demo", () => {
  test.describe("Landing Page", () => {
    test("should render landing page", async ({ page }) => {
      // Create a mock landing page for the demo
      await page.setContent(`
        <html>
          <head>
            <title>gen-md - Generative Markdown Framework</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
              }
              .container {
                text-align: center;
                padding: 40px;
                max-width: 800px;
              }
              h1 {
                font-size: 4rem;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              }
              .tagline {
                font-size: 1.5rem;
                opacity: 0.9;
                margin-bottom: 40px;
              }
              .features {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 40px;
              }
              .feature {
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .feature h3 {
                margin-bottom: 10px;
              }
              .cta {
                display: inline-block;
                background: white;
                color: #667eea;
                padding: 15px 40px;
                border-radius: 30px;
                text-decoration: none;
                font-weight: bold;
                font-size: 1.2rem;
                margin-top: 20px;
                transition: transform 0.2s;
              }
              .cta:hover {
                transform: scale(1.05);
              }
              code {
                background: rgba(0,0,0,0.2);
                padding: 2px 8px;
                border-radius: 4px;
                font-family: 'Monaco', monospace;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>gen-md</h1>
              <p class="tagline">Generative Markdown Framework</p>
              <p>Define how files are generated using simple <code>.gen.md</code> prompts.</p>
              <a href="#get-started" class="cta">Get Started</a>
              <div class="features">
                <div class="feature">
                  <h3>Cascading</h3>
                  <p>Inherit configurations from parent directories</p>
                </div>
                <div class="feature">
                  <h3>Compaction</h3>
                  <p>Merge multiple .gen.md files into one</p>
                </div>
                <div class="feature">
                  <h3>Validation</h3>
                  <p>Verify outputs match expectations</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/web-demo-landing.png",
        fullPage: true,
      });
    });
  });

  test.describe("Interactive Editor", () => {
    test("should render interactive .gen.md editor", async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <title>gen-md Editor</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
                min-height: 100vh;
              }
              .header {
                background: #333;
                color: white;
                padding: 15px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .header h1 {
                font-size: 1.5rem;
              }
              .main {
                display: grid;
                grid-template-columns: 1fr 1fr;
                height: calc(100vh - 60px);
              }
              .editor-panel, .preview-panel {
                padding: 20px;
                overflow: auto;
              }
              .editor-panel {
                background: #1e1e1e;
              }
              .preview-panel {
                background: white;
                border-left: 1px solid #ddd;
              }
              .panel-header {
                font-weight: bold;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                color: #888;
              }
              .preview-panel .panel-header {
                border-bottom-color: #ddd;
                color: #333;
              }
              textarea {
                width: 100%;
                height: calc(100% - 40px);
                background: transparent;
                border: none;
                color: #d4d4d4;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 14px;
                line-height: 1.5;
                resize: none;
              }
              textarea:focus {
                outline: none;
              }
              .preview-content {
                font-size: 14px;
                line-height: 1.6;
              }
              .preview-content h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
              }
              .preview-content p {
                margin-bottom: 1rem;
              }
              .btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <header class="header">
              <h1>gen-md Editor</h1>
              <button class="btn">Generate</button>
            </header>
            <main class="main">
              <div class="editor-panel">
                <div class="panel-header">INPUT: README.gen.md</div>
                <textarea>---
name: "Project README"
description: "Generate README for the project"
context:
  - "./package.json"
  - "./src/index.ts"
skills:
  - "./.agent/skills/gen-md/SKILL.md"
output: "README.md"
---
&lt;input&gt;
Generate a comprehensive README for this project.

Include:
- Project description
- Installation instructions
- Usage examples
- API documentation
&lt;/input&gt;</textarea>
              </div>
              <div class="preview-panel">
                <div class="panel-header">OUTPUT: README.md</div>
                <div class="preview-content">
                  <h1>My Project</h1>
                  <p>A powerful tool for generating content using natural language prompts.</p>
                  <h2>Installation</h2>
                  <p><code>npm install my-project</code></p>
                  <h2>Usage</h2>
                  <p>Import and use the library:</p>
                  <pre><code>import { generate } from 'my-project';
generate('input.gen.md');</code></pre>
                </div>
              </div>
            </main>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/web-demo-editor.png",
        fullPage: true,
      });
    });
  });

  test.describe("Cascade Visualization", () => {
    test("should render cascade chain visualization", async ({ page }) => {
      await page.setContent(`
        <html>
          <head>
            <title>Cascade Chain Visualization</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #1a1a2e;
                color: white;
                min-height: 100vh;
                padding: 40px;
              }
              h1 {
                text-align: center;
                margin-bottom: 40px;
                color: #667eea;
              }
              .cascade {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .node {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 20px 30px;
                border-radius: 10px;
                min-width: 300px;
                text-align: center;
                position: relative;
              }
              .node::after {
                content: '';
                position: absolute;
                bottom: -20px;
                left: 50%;
                width: 2px;
                height: 20px;
                background: #667eea;
              }
              .node:last-child::after {
                display: none;
              }
              .node-path {
                font-family: 'Monaco', monospace;
                font-size: 12px;
                opacity: 0.8;
                margin-bottom: 5px;
              }
              .node-name {
                font-weight: bold;
                font-size: 16px;
              }
              .node-skills {
                font-size: 12px;
                margin-top: 10px;
                color: rgba(255,255,255,0.7);
              }
              .arrow {
                color: #667eea;
                font-size: 24px;
              }
              .merged {
                margin-top: 40px;
                background: rgba(102, 126, 234, 0.2);
                border: 2px solid #667eea;
                padding: 30px;
                border-radius: 10px;
                max-width: 400px;
              }
              .merged h2 {
                margin-bottom: 20px;
                color: #667eea;
              }
              .merged-item {
                margin: 10px 0;
                font-family: 'Monaco', monospace;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <h1>Cascade Chain Visualization</h1>
            <div class="cascade">
              <div class="node">
                <div class="node-path">/project/.gen.md</div>
                <div class="node-name">Root Config</div>
                <div class="node-skills">skills: ["base-skill"]</div>
              </div>
              <div class="node">
                <div class="node-path">/project/packages/.gen.md</div>
                <div class="node-name">Packages Config</div>
                <div class="node-skills">skills: ["pkg-documentation"]</div>
              </div>
              <div class="node">
                <div class="node-path">/project/packages/cli/README.gen.md</div>
                <div class="node-name">CLI README Generator</div>
                <div class="node-skills">skills: ["cli-readme"]</div>
              </div>
            </div>
            <div class="cascade">
              <div class="merged">
                <h2>Merged Configuration</h2>
                <div class="merged-item">skills: ["base-skill", "pkg-documentation", "cli-readme"]</div>
                <div class="merged-item">output: "README.md"</div>
              </div>
            </div>
          </body>
        </html>
      `);

      await page.screenshot({
        path: "./screenshots/web-demo-cascade.png",
        fullPage: true,
      });
    });
  });
});
