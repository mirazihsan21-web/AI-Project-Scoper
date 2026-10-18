import type { FeatureType, IntegrationType } from "@/lib/scope/catalog";
import type { Severity } from "@/lib/scope/schema";

type HourRange = readonly [low: number, high: number];

export type PricingConfig = {
  currency: string;
  /** Blended hourly rate across design, dev and QA. */
  hourlyRate: number;
  /** Build hours per feature type: effectively the price list. */
  featureHours: Record<FeatureType, HourRange>;
  integrationHours: Record<IntegrationType, HourRange>;
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
  featureHours: {
    content_pages: [8, 16],
    accounts: [12, 24],
    records_management: [12, 28],
    search_filtering: [16, 32],
    booking_scheduling: [32, 64],
    cart_checkout: [32, 56],
    payments_billing: [24, 56],
    messaging_chat: [24, 56],
    notifications: [12, 28],
    dashboard_reporting: [20, 40],
    teams_permissions: [20, 40],
    reviews_ratings: [12, 24],
    media_files: [12, 28],
    maps_location: [16, 32],
    ai_assistant: [32, 72],
    data_import_sync: [16, 40],
    matching_marketplace: [40, 80],
    other: [16, 40],
  },
  integrationHours: {
    payment_provider: [8, 16],
    messaging_provider: [6, 14],
    calendar: [12, 24],
    maps_geo: [4, 10],
    auth_provider: [6, 12],
    ai_provider: [8, 16],
    ecommerce_platform: [12, 24],
    crm_helpdesk: [12, 24],
    accounting: [12, 24],
    legacy_system: [32, 64],
    other_api: [8, 20],
  },
  overheadPct: 0.2,
  contingencyPct: { low: 0.1, medium: 0.15, high: 0.25 },
  teamHoursPerWeek: 60,
  priceRounding: 500,
};
