import { APIConnectionError, APIError } from "groq-sdk";
import { describe, expect, it } from "vitest";
import { toModelCallError } from "@/lib/scope/groq";

const apiError = (status: number, headers: Record<string, string> = {}) =>
  APIError.generate(status, { error: { message: `HTTP ${status}` } }, undefined, new Headers(headers));

describe("toModelCallError", () => {
  it("maps a 429 to rate_limited and reads retry-after seconds", () => {
    const e = toModelCallError(apiError(429, { "retry-after": "57.66" }));
    expect(e.kind).toBe("rate_limited");
    expect(e.retryAfterMs).toBe(57_660);
  });

  it("leaves retryAfterMs unset when a 429 has no retry-after header", () => {
    expect(toModelCallError(apiError(429)).retryAfterMs).toBeUndefined();
  });

  it.each([401, 403])("maps %i to auth", (status) => {
    expect(toModelCallError(apiError(status)).kind).toBe("auth");
  });

  it.each([400, 413, 500, 503])("maps %i to failed so the next model is tried", (status) => {
    expect(toModelCallError(apiError(status)).kind).toBe("failed");
  });

  it("maps a connection error to failed", () => {
    expect(toModelCallError(new APIConnectionError({ message: "socket hang up" })).kind).toBe("failed");
  });
});
