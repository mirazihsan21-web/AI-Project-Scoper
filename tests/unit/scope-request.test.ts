import { describe, expect, it, vi } from "vitest";
import type { NewScope } from "@/lib/db/scopes";
import {
  AllModelsBusyError,
  BriefRejectedError,
  ScopeGenerationError,
  type GenerateResult,
} from "@/lib/scope/generate";
import { handleScopeRequest, type ScopeRequestDeps } from "@/lib/scope/request";
import { sampleScope } from "../fixtures/scope";

const BRIEF = "Need an app where gym members book classes and pay monthly.";

const generated: GenerateResult = {
  scope: sampleScope,
  model: "openai/gpt-oss-120b",
  latencyMs: 2100,
  inputTokens: 900,
  outputTokens: 1500,
  attempts: [{ model: "openai/gpt-oss-120b", outcome: "ok" }],
};

function deps(overrides: Partial<ScopeRequestDeps> = {}) {
  const calls = { generate: 0, saved: [] as NewScope[] };
  const d: ScopeRequestDeps = {
    checkLimit: async () => ({ allowed: true, retryAfterMs: 0 }),
    generate: async () => {
      calls.generate++;
      return generated;
    },
    save: async (s) => {
      calls.saved.push(s);
      return "11111111-1111-4111-8111-111111111111";
    },
    ...overrides,
  };
  return { d, calls };
}

describe("handleScopeRequest", () => {
  it("generates, prices and saves the scope, then returns its id", async () => {
    const { d, calls } = deps();

    const result = await handleScopeRequest({ brief: `  ${BRIEF}  ` }, d);

    expect(result).toEqual({ status: 201, body: { id: "11111111-1111-4111-8111-111111111111" } });
    expect(calls.saved).toHaveLength(1);
    expect(calls.saved[0]).toMatchObject({ brief: BRIEF, scope: sampleScope, model: "openai/gpt-oss-120b", latencyMs: 2100 });
    expect(calls.saved[0].estimate.full.priceHigh).toBeGreaterThan(0);
  });

  it.each([
    ["no body", undefined],
    ["a brief that is not text", { brief: 42 }],
    ["an empty brief", { brief: "   " }],
    ["a brief under 20 characters", { brief: "need an app" }],
    ["a brief over 10,000 characters", { brief: "a".repeat(10_001) }],
  ])("rejects %s with 400 before using any quota", async (_label, body) => {
    let limited = 0;
    const { d, calls } = deps({
      checkLimit: async () => {
        limited++;
        return { allowed: true, retryAfterMs: 0 };
      },
    });

    const result = await handleScopeRequest(body, d);

    expect(result.status).toBe(400);
    expect(result.body).toHaveProperty("error");
    expect(limited).toBe(0);
    expect(calls.generate).toBe(0);
  });

  it("returns 429 with Retry-After when the visitor is over the hourly limit, without calling the AI", async () => {
    const { d, calls } = deps({ checkLimit: async () => ({ allowed: false, retryAfterMs: 125_000 }) });

    const result = await handleScopeRequest({ brief: BRIEF }, d);

    expect(result.status).toBe(429);
    expect(result.retryAfterSeconds).toBe(125);
    expect(calls.generate).toBe(0);
  });

  it.each([
    ["the injection guard rejects the brief", new BriefRejectedError(), 422, undefined],
    ["every model is rate limited", new AllModelsBusyError(30_500), 503, 31],
    ["no model produces a valid scope", new ScopeGenerationError([]), 502, undefined],
    ["something unexpected fails", new Error("boom"), 500, undefined],
  ])("maps the case where %s to %i", async (_label, error, status, retryAfterSeconds) => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, calls } = deps({
      generate: async () => {
        throw error;
      },
    });

    const result = await handleScopeRequest({ brief: BRIEF }, d);

    expect(result.status).toBe(status);
    expect(result.retryAfterSeconds).toBe(retryAfterSeconds);
    expect(result.body).toHaveProperty("error");
    expect(calls.saved).toHaveLength(0);
    // Server-side failures are logged for debugging; visitor mistakes and expected limits are not.
    expect(logged.mock.calls.length > 0).toBe(status >= 500 && status !== 503);
    logged.mockRestore();
  });
});
