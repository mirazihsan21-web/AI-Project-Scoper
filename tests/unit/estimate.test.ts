import { describe, expect, it } from "vitest";
import { estimate } from "@/lib/pricing/estimate";
import type { PricingConfig } from "@/lib/pricing/config";
import type { Scope } from "@/lib/scope/schema";
import { sampleScope } from "../fixtures/scope";

// Round numbers so every expected value below can be worked out by hand.
const config: PricingConfig = {
  currency: "USD",
  hourlyRate: 100,
  featureHours: { xs: [1, 2], s: [2, 4], m: [10, 20], l: [20, 40], xl: [40, 80] },
  integrationHours: { s: [5, 10], m: [10, 20], l: [20, 40] },
  overheadPct: 0.2,
  contingencyPct: { low: 0, medium: 0.2, high: 0.6 },
  teamHoursPerWeek: 40,
  priceRounding: 500,
};

const mustM = { name: "Core", description: "d", priority: "must", complexity: "m" } as const;

function scope(overrides: Partial<Scope>): Scope {
  return { ...sampleScope, integrations: [], risks: [], milestones: [], features: [mustM], ...overrides };
}

describe("estimate", () => {
  it.each([
    {
      case: "one must feature, overhead only",
      s: scope({}),
      // 10–20h × 1.2 = 12–24h; $1200 floors to $1000, $2400 ceils to $2500
      mvp: { hoursLow: 12, hoursHigh: 24, priceLow: 1000, priceHigh: 2500, weeksLow: 1, weeksHigh: 1 },
    },
    {
      case: "integrations count toward the MVP",
      s: scope({ integrations: [{ name: "Stripe", purpose: "p", complexity: "m" }] }),
      // (10+10)–(20+20)h × 1.2 = 24–48h
      mvp: { hoursLow: 24, hoursHigh: 48, priceLow: 2000, priceHigh: 5000, weeksLow: 1, weeksHigh: 2 },
    },
    {
      case: "highest risk severity sets contingency",
      s: scope({
        risks: [
          { title: "a", detail: "d", severity: "low", mitigation: "m" },
          { title: "b", detail: "d", severity: "high", mitigation: "m" },
        ],
      }),
      // 10–20h × 1.2 × 1.6 = 19.2–38.4h → 19–38h
      mvp: { hoursLow: 19, hoursHigh: 38, priceLow: 1500, priceHigh: 4000, weeksLow: 1, weeksHigh: 1 },
    },
    {
      case: "medium risk contingency",
      s: scope({ risks: [{ title: "a", detail: "d", severity: "medium", mitigation: "m" }] }),
      // 10–20h × 1.2 × 1.2 = 14.4–28.8h → 14–29h
      mvp: { hoursLow: 14, hoursHigh: 29, priceLow: 1000, priceHigh: 3000, weeksLow: 1, weeksHigh: 1 },
    },
    {
      case: "tiny scope still prices at one rounding unit",
      s: scope({ features: [{ ...mustM, complexity: "xs" }] }),
      // 1–2h × 1.2 = 1.2–2.4h → 1–2h; $100 and $200 both clamp to $500
      mvp: { hoursLow: 1, hoursHigh: 2, priceLow: 500, priceHigh: 500, weeksLow: 1, weeksHigh: 1 },
    },
  ])("$case", ({ s, mvp }) => {
    expect(estimate(s, config).mvp).toEqual(mvp);
  });

  it("MVP counts only must-haves while Full adds should and could", () => {
    const result = estimate(
      scope({
        features: [
          mustM,
          { name: "S", description: "d", priority: "should", complexity: "s" },
          { name: "C", description: "d", priority: "could", complexity: "l" },
        ],
      }),
      config,
    );
    expect(result.mvp.hoursLow).toBe(12);
    expect(result.mvp.hoursHigh).toBe(24);
    // (10+2+20)–(20+4+40)h × 1.2 = 38.4–76.8h → 38–77h
    expect(result.full).toEqual({
      hoursLow: 38,
      hoursHigh: 77,
      priceLow: 3500,
      priceHigh: 8000,
      weeksLow: 1,
      weeksHigh: 2,
    });
  });

  it("sums milestone hours from referenced features, matching names case-insensitively", () => {
    const result = estimate(
      scope({ features: sampleScope.features, milestones: sampleScope.milestones }),
      config,
    );
    expect(result.milestones).toEqual([
      // "Online Ordering" m: 10–20h × 1.2
      { name: "MVP launch", hoursLow: 12, hoursHigh: 24, weeksLow: 1, weeksHigh: 1 },
      // "admin dashboard" → "Admin Dashboard" s: 2–4h × 1.2 = 2.4–4.8h; unknown name ignored
      { name: "Operations", hoursLow: 2, hoursHigh: 5, weeksLow: 1, weeksHigh: 1 },
    ]);
  });

  it("reports the assumptions it priced with", () => {
    const result = estimate(
      scope({ risks: [{ title: "a", detail: "d", severity: "medium", mitigation: "m" }] }),
      config,
    );
    expect(result.assumptions).toEqual({
      currency: "USD",
      hourlyRate: 100,
      overheadPct: 0.2,
      contingencyPct: 0.2,
      teamHoursPerWeek: 40,
    });
  });
});
