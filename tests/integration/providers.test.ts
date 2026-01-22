import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { llm, getProviderConfig } from "../../src/providers/index.js";
import { validateOutput } from "../../src/validation/index.js";

// Store original env to restore after tests
const originalEnv = { ...process.env };

describe("Provider Integration Tests", () => {
  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
  });

  describe("Anthropic Provider", () => {
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

    beforeEach(() => {
      if (hasAnthropicKey) {
        // Clear other provider keys, keep only Anthropic
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_REGION;
        process.env.GITGEN_PROVIDER = "anthropic";
      }
    });

    it.skipIf(!hasAnthropicKey)("should generate text with Anthropic", async () => {
      const result = await llm('Say "hello" and nothing else.');
      expect(result.toLowerCase()).toContain("hello");
    }, 30000);

    it.skipIf(!hasAnthropicKey)("should generate valid TypeScript", async () => {
      const result = await llm(
        "Generate a TypeScript function that adds two numbers. Output only the code, no explanations, no markdown."
      );

      // Validate the output
      const validation = validateOutput(result, { type: "file", filePath: "add.ts" });

      expect(result).toContain("function");
      expect(result).toContain("return");
      expect(validation.valid).toBe(true);
    }, 30000);

    it.skipIf(!hasAnthropicKey)("should generate valid JSON plan", async () => {
      const result = await llm(`Create a simple implementation plan as JSON with this exact format:
{
  "files": [
    {"path": "src/example.ts", "action": "create", "description": "Example file"}
  ]
}
Output only the JSON, nothing else.`);

      const validation = validateOutput(result, { type: "plan" });
      expect(validation.valid).toBe(true);
    }, 30000);
  });

  describe("OpenRouter Provider", () => {
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;

    beforeEach(() => {
      if (hasOpenRouterKey) {
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_REGION;
        process.env.GITGEN_PROVIDER = "openrouter";
      }
    });

    it.skipIf(!hasOpenRouterKey)("should generate text with OpenRouter", async () => {
      const result = await llm('Say "hello" and nothing else.');
      expect(result.toLowerCase()).toContain("hello");
    }, 30000);

    it.skipIf(!hasOpenRouterKey)("should generate valid TypeScript", async () => {
      const result = await llm(
        "Generate a TypeScript function that multiplies two numbers. Output only the code, no explanations, no markdown."
      );

      const validation = validateOutput(result, { type: "file", filePath: "multiply.ts" });
      expect(result).toContain("function");
      expect(validation.valid).toBe(true);
    }, 30000);
  });

  describe("AWS Bedrock Provider", () => {
    const hasBedrockCredentials =
      !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

    beforeEach(() => {
      if (hasBedrockCredentials) {
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        process.env.GITGEN_PROVIDER = "bedrock";
        if (!process.env.AWS_REGION) {
          process.env.AWS_REGION = "us-east-1";
        }
      }
    });

    it.skipIf(!hasBedrockCredentials)("should generate text with Bedrock", async () => {
      const result = await llm('Say "hello" and nothing else.');
      expect(result.toLowerCase()).toContain("hello");
    }, 30000);

    it.skipIf(!hasBedrockCredentials)("should generate valid TypeScript", async () => {
      const result = await llm(
        "Generate a TypeScript function that subtracts two numbers. Output only the code, no explanations, no markdown."
      );

      const validation = validateOutput(result, { type: "file", filePath: "subtract.ts" });
      expect(result).toContain("function");
      expect(validation.valid).toBe(true);
    }, 30000);
  });

  describe("Provider Detection", () => {
    it("should correctly detect provider from environment", () => {
      // This test runs with whatever provider is configured
      const hasAnyProvider =
        process.env.ANTHROPIC_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        process.env.AWS_ACCESS_KEY_ID;

      if (hasAnyProvider) {
        const config = getProviderConfig();
        expect(["anthropic", "bedrock", "openrouter"]).toContain(config.provider);
      }
    });
  });
});
