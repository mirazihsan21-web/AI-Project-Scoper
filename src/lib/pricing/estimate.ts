import type { Scope, Severity } from "@/lib/scope/schema";
import type { PricingConfig } from "./config";

export type TierEstimate = {
  hoursLow: number;
  hoursHigh: number;
  priceLow: number;
  priceHigh: number;
  weeksLow: number;
  weeksHigh: number;
};

export type MilestoneEstimate = {
  name: string;
  hoursLow: number;
  hoursHigh: number;
  weeksLow: number;
  weeksHigh: number;
};

export type Estimate = {
  /** Must-have features plus all integrations. */
  mvp: TierEstimate;
  /** Every feature plus all integrations. */
  full: TierEstimate;
  milestones: MilestoneEstimate[];
  assumptions: {
    currency: string;
    hourlyRate: number;
    overheadPct: number;
    contingencyPct: number;
    teamHoursPerWeek: number;
  };
};

type Range = [low: number, high: number];

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high"];

function sum(ranges: Range[]): Range {
  return ranges.reduce<Range>(([l, h], [rl, rh]) => [l + rl, h + rh], [0, 0]);
}

function highestSeverity(scope: Scope): Severity {
  return scope.risks.reduce<Severity>(
    (worst, r) => (SEVERITY_ORDER.indexOf(r.severity) > SEVERITY_ORDER.indexOf(worst) ? r.severity : worst),
    "low",
  );
}

export function estimate(scope: Scope, config: PricingConfig): Estimate {
  const contingencyPct = config.contingencyPct[highestSeverity(scope)];
  const multiplier = (1 + config.overheadPct) * (1 + contingencyPct);
  const unit = config.priceRounding;

  const toHours = ([low, high]: Range): Range => [Math.round(low * multiplier), Math.round(high * multiplier)];
  const toWeeks = (hours: number) => Math.ceil(hours / config.teamHoursPerWeek);

  const featureRange = (f: Scope["features"][number]): Range => [...config.featureHours[f.type]];
  const integrationHours = sum(scope.integrations.map((i): Range => [...config.integrationHours[i.type]]));

  function tier(features: Scope["features"]): TierEstimate {
    const [hoursLow, hoursHigh] = toHours(sum([...features.map(featureRange), integrationHours]));
    return {
      hoursLow,
      hoursHigh,
      priceLow: Math.max(unit, Math.floor((hoursLow * config.hourlyRate) / unit) * unit),
      priceHigh: Math.max(unit, Math.ceil((hoursHigh * config.hourlyRate) / unit) * unit),
      weeksLow: toWeeks(hoursLow),
      weeksHigh: toWeeks(hoursHigh),
    };
  }

  const byName = new Map(scope.features.map((f) => [f.name.trim().toLowerCase(), f]));
  const milestones = scope.milestones.map((m) => {
    const features = m.featureNames.flatMap((n) => byName.get(n.trim().toLowerCase()) ?? []);
    const [hoursLow, hoursHigh] = toHours(sum(features.map(featureRange)));
    return { name: m.name, hoursLow, hoursHigh, weeksLow: toWeeks(hoursLow), weeksHigh: toWeeks(hoursHigh) };
  });

  return {
    mvp: tier(scope.features.filter((f) => f.priority === "must")),
    full: tier(scope.features),
    milestones,
    assumptions: {
      currency: config.currency,
      hourlyRate: config.hourlyRate,
      overheadPct: config.overheadPct,
      contingencyPct,
      teamHoursPerWeek: config.teamHoursPerWeek,
    },
  };
}
