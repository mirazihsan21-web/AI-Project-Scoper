import { describe, expect, it } from "vitest";
import { hashIp, rateLimitDecision } from "@/lib/db/rate-limit";

const NOW = Date.parse("2026-10-19T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const opts = { limit: 3, windowMs: HOUR, now: NOW };
const ago = (ms: number) => new Date(NOW - ms);

describe("rateLimitDecision", () => {
  it("allows a visitor under the limit", () => {
    expect(rateLimitDecision([ago(10_000), ago(20_000)], opts)).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it("blocks at the limit and says when the oldest request leaves the window", () => {
    // Oldest of the three is 50 min old, so a slot frees up in 10 min.
    const recent = [ago(50 * 60_000), ago(5 * 60_000), ago(60_000)];
    expect(rateLimitDecision(recent, opts)).toEqual({ allowed: false, retryAfterMs: 10 * 60_000 });
  });

  it("ignores requests older than the window", () => {
    const recent = [ago(2 * HOUR), ago(HOUR + 1), ago(60_000)];
    expect(rateLimitDecision(recent, opts).allowed).toBe(true);
  });
});

describe("hashIp", () => {
  it("is stable for the same IP and salt", () => {
    expect(hashIp("203.0.113.7", "salt")).toBe(hashIp("203.0.113.7", "salt"));
  });

  it("changes with the salt, so hashes are useless without it", () => {
    expect(hashIp("203.0.113.7", "salt-a")).not.toBe(hashIp("203.0.113.7", "salt-b"));
  });

  it("never contains the raw IP", () => {
    expect(hashIp("203.0.113.7", "salt")).not.toContain("203.0.113.7");
  });
});
