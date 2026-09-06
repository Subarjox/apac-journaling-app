import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getGeminiApiKey, resetSecretCache } from "@/lib/secrets/secretManager";

describe("Google Cloud Secret Manager Retriever", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetSecretCache();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetSecretCache();
  });

  it("retrieves the API key from environment fallback when secret manager is not requested", async () => {
    process.env.GEMINI_API_KEY = "test-env-gemini-key";
    delete process.env.GEMINI_API_KEY_SECRET_NAME;
    delete process.env.USE_SECRET_MANAGER;

    const key = await getGeminiApiKey();
    expect(key).toBe("test-env-gemini-key");
  });

  it("caches the resolved key in-memory to prevent repeated remote requests", async () => {
    process.env.GEMINI_API_KEY = "initial-cached-key";
    const key1 = await getGeminiApiKey();
    expect(key1).toBe("initial-cached-key");

    // Change env - key should remain cached
    process.env.GEMINI_API_KEY = "changed-key";
    const key2 = await getGeminiApiKey();
    expect(key2).toBe("initial-cached-key");

    // After reset, fresh key is read
    resetSecretCache();
    const key3 = await getGeminiApiKey();
    expect(key3).toBe("changed-key");
  });

  it("handles missing key gracefully without crashing", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_SECRET_NAME;
    delete process.env.USE_SECRET_MANAGER;

    const key = await getGeminiApiKey();
    expect(key).toBe("");
  });
});
