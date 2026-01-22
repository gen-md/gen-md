import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getProviderConfig, resolveModel } from "../../src/providers/index.js";

describe("Provider Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all provider-related env vars
    delete process.env.GITGEN_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_REGION;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getProviderConfig", () => {
    it("should detect anthropic from ANTHROPIC_API_KEY", () => {
      process.env.ANTHROPIC_API_KEY = "sk-test";
      const config = getProviderConfig();
      expect(config.provider).toBe("anthropic");
    });

    it("should detect bedrock from AWS credentials", () => {
      process.env.AWS_ACCESS_KEY_ID = "AKIA...";
      const config = getProviderConfig();
      expect(config.provider).toBe("bedrock");
    });

    it("should detect bedrock from AWS_REGION alone", () => {
      process.env.AWS_REGION = "us-east-1";
      const config = getProviderConfig();
      expect(config.provider).toBe("bedrock");
    });

    it("should detect openrouter from OPENROUTER_API_KEY", () => {
      process.env.OPENROUTER_API_KEY = "sk-or-test";
      const config = getProviderConfig();
      expect(config.provider).toBe("openrouter");
    });

    it("should prefer explicit GITGEN_PROVIDER over auto-detection", () => {
      process.env.ANTHROPIC_API_KEY = "sk-test";
      process.env.GITGEN_PROVIDER = "openrouter";
      process.env.OPENROUTER_API_KEY = "sk-or-test";
      const config = getProviderConfig();
      expect(config.provider).toBe("openrouter");
    });

    it("should throw when no provider is configured", () => {
      expect(() => getProviderConfig()).toThrow("No provider configured");
    });

    it("should prioritize bedrock over openrouter when both available", () => {
      process.env.AWS_ACCESS_KEY_ID = "AKIA...";
      process.env.OPENROUTER_API_KEY = "sk-or-test";
      const config = getProviderConfig();
      expect(config.provider).toBe("bedrock");
    });

    it("should prioritize openrouter over anthropic when both available", () => {
      process.env.OPENROUTER_API_KEY = "sk-or-test";
      process.env.ANTHROPIC_API_KEY = "sk-test";
      const config = getProviderConfig();
      expect(config.provider).toBe("openrouter");
    });
  });

  describe("resolveModel", () => {
    it("should resolve model aliases for anthropic", () => {
      expect(resolveModel("claude-sonnet", "anthropic")).toBe("claude-sonnet-4-20250514");
      expect(resolveModel("claude-opus", "anthropic")).toBe("claude-opus-4-20250514");
      expect(resolveModel("claude-haiku", "anthropic")).toBe("claude-3-5-haiku-20241022");
    });

    it("should resolve model aliases for bedrock", () => {
      expect(resolveModel("claude-sonnet", "bedrock")).toBe(
        "anthropic.claude-sonnet-4-20250514-v1:0"
      );
      expect(resolveModel("claude-opus", "bedrock")).toBe("anthropic.claude-opus-4-20250514-v1:0");
    });

    it("should resolve model aliases for openrouter", () => {
      expect(resolveModel("gemini", "openrouter")).toBe("google/gemini-2.0-flash-exp:free");
      expect(resolveModel("llama", "openrouter")).toBe("meta-llama/llama-3.3-70b-instruct:free");
    });

    it("should pass through direct model IDs", () => {
      expect(resolveModel("custom-model-id", "anthropic")).toBe("custom-model-id");
      expect(resolveModel("my-custom/model", "openrouter")).toBe("my-custom/model");
    });

    it("should return default model when alias is undefined", () => {
      expect(resolveModel(undefined, "anthropic")).toBe("claude-sonnet-4-20250514");
      expect(resolveModel(undefined, "bedrock")).toBe("anthropic.claude-sonnet-4-20250514-v1:0");
      expect(resolveModel(undefined, "openrouter")).toBe("meta-llama/llama-3.3-70b-instruct:free");
    });
  });
});
