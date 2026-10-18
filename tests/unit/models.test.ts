import { describe, expect, it } from "vitest";
import { resolveModels } from "@/lib/scope/models";

describe("resolveModels", () => {
  it("defaults to 120b, then 20b, then Qwen", () => {
    expect(resolveModels(undefined).map((m) => m.id)).toEqual([
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ]);
  });

  it("follows the order given in GROQ_MODELS and ignores blanks", () => {
    expect(resolveModels(" openai/gpt-oss-20b, ,qwen/qwen3.8-27b ").map((m) => m.id)).toEqual([
      "openai/gpt-oss-20b",
      "qwen/qwen3.8-27b",
    ]);
  });

  it("caps Qwen's output to fit the free tier's 1000 output-tokens-per-minute limit", () => {
    const [qwen] = resolveModels("qwen/qwen3.8-27b");
    expect(qwen.maxTokens).toBeLessThanOrEqual(1000);
    expect(qwen.reasoningEffort).toBe("none");
  });

  it("gives an unknown model id generic settings instead of dropping it", () => {
    const [m] = resolveModels("some/new-model");
    expect(m.id).toBe("some/new-model");
    expect(m.maxTokens).toBeGreaterThan(0);
  });
});
