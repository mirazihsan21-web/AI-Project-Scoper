import { describe, expect, it } from "vitest";
import { PRICING_CONFIG } from "@/lib/pricing/config";

// The values are assumptions and will be tuned; these checks only catch ranges that would break the estimate.
describe("PRICING_CONFIG hour ranges", () => {
  it.each([
    ["feature", PRICING_CONFIG.featureHours],
    ["integration", PRICING_CONFIG.integrationHours],
  ] as const)("every %s type has a positive range with low below high", (_kind, table) => {
    const bad = Object.entries(table).filter(([, [low, high]]) => !(low > 0 && low < high));
    expect(bad).toEqual([]);
  });
});
