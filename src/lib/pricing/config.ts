import type { FeatureSize, IntegrationSize, Severity } from "@/lib/scope/schema";

type HourRange = readonly [low: number, high: number];

export type PricingConfig = {
  currency: string;
  /** Blended hourly rate across design, dev and QA. */
  hourlyRate: number;
  featureHours: Record<FeatureSize, HourRange>;
  integrationHours: Record<IntegrationSize, HourRange>;
  /** Project management and QA on top of build hours. */
  overheadPct: number;
  /** Buffer chosen by the highest risk severity; `low` also applies when there are no risks. */
  contingencyPct: Record<Severity, number>;
  /** Team throughput, used to turn hours into calendar weeks. */
  teamHoursPerWeek: number;
  /** Low prices round down and high prices round up to this unit. */
  priceRounding: number;
};

// ASSUMED VALUES. These are placeholders, not taken from past projects.
// Tune them once real project data exists, and log the change in memory.md.
export const PRICING_CONFIG: PricingConfig = {
  currency: "USD",
  hourlyRate: 45,
  featureHours: { xs: [4, 8], s: [8, 16], m: [16, 40], l: [40, 80], xl: [80, 160] },
  integrationHours: { s: [6, 12], m: [12, 24], l: [24, 48] },
  overheadPct: 0.2,
  contingencyPct: { low: 0.1, medium: 0.15, high: 0.25 },
  teamHoursPerWeek: 60,
  priceRounding: 500,
};
