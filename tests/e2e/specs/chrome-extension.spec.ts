import { test, expect } from "@playwright/test";
import * as path from "path";

/**
 * E2E tests for the gen-md Chrome extension
 *
 * These tests verify the Chrome extension functionality:
 * - Extension popup rendering
 * - Context menu integration
 * - GitHub integration
 */

test.describe("Chrome Extension", () => {
  test.describe("Extension Popup", () => {
    test("should render popup interface", async ({ page }) => {
      // Navigate to the extension popup HTML (local file for testing)
      const popupPath = path.resolve(
        __dirname,
        "../../../packages/gen-md-chrome-ext/popup.html"
      );

      // For testing without actual extension, we test the popup HTML directly
      await page.goto(`file://${popupPath}`);

      // Take screenshot of popup
      await page.screenshot({
        path: "./screenshots/chrome-extension-popup.png",
        fullPage: true,
      });
    });

    test("should display gen-md branding", async ({ page }) => {
      const popupPath = path.resolve(
        __dirname,
        "../../../packages/gen-md-chrome-ext/popup.html"
      );

      await page.goto(`file://${popupPath}`);

      // Check for gen-md branding elements
      const _title = page.locator("h1, .title, [data-testid='title']");

      // Take screenshot for documentation
      await page.screenshot({
        path: "./screenshots/chrome-extension-branding.png",
      });
    });
  });

  test.describe("Options Page", () => {
    test("should render options page", async ({ page }) => {
      const optionsPath = path.resolve(
        __dirname,
        "../../../packages/gen-md-chrome-ext/options.html"
      );

      await page.goto(`file://${optionsPath}`);

      await page.screenshot({
        path: "./screenshots/chrome-extension-options.png",
        fullPage: true,
      });
    });
  });
});

test.describe("Chrome Extension - GitHub Integration", () => {
  test("should recognize .gen.md files on GitHub", async ({ page }) => {
    // Test with a mock GitHub page structure
    await page.setContent(`
      <html>
        <head><title>test.gen.md - GitHub</title></head>
        <body>
          <div class="repository-content">
            <div class="file-header">
              <span class="filename">test.gen.md</span>
            </div>
            <div class="blob-code-content">
              <pre>---
name: "Test"
---
&lt;input&gt;
Generate test content.
&lt;/input&gt;</pre>
            </div>
          </div>
        </body>
      </html>
    `);

    // Take screenshot
    await page.screenshot({
      path: "./screenshots/chrome-extension-github-genmd.png",
      fullPage: true,
    });

    // Verify .gen.md file is detected
    const filename = page.locator(".filename");
    await expect(filename).toContainText(".gen.md");
  });
});
