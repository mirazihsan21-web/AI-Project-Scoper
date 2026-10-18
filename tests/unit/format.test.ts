import { describe, expect, it } from "vitest";
import { formatMoneyRange, formatWeeks } from "@/lib/format";
import { clientIp } from "@/lib/http/client-ip";

describe("formatMoneyRange", () => {
  it.each([
    [7500, 16500, "USD", "$7,500–$16,500"],
    [500, 500, "USD", "$500"],
  ])("%i–%i %s → %s", (low, high, currency, want) => {
    expect(formatMoneyRange(low, high, currency)).toBe(want);
  });
});

describe("formatWeeks", () => {
  it.each([
    [1, 1, "1 week"],
    [2, 2, "2 weeks"],
    [5, 9, "5–9 weeks"],
  ])("%i–%i → %s", (low, high, want) => {
    expect(formatWeeks(low, high)).toBe(want);
  });
});

describe("clientIp", () => {
  it("prefers x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "198.51.100.1" }))).toBe("203.0.113.9");
  });

  it("takes the first address in x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
  });

  it("falls back to a fixed value when no proxy header is present (local dev)", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
