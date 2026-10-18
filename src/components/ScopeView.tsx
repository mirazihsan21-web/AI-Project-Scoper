import type { StoredScope } from "@/lib/db/scopes";
import { formatMoneyRange, formatWeeks } from "@/lib/format";
import {
  FEATURE_TYPE_LABELS,
  INTEGRATION_TYPE_LABELS,
  PRIORITY_LABELS,
  PROJECT_TYPE_LABELS,
  SEVERITY_LABELS,
} from "@/lib/labels";
import type { TierEstimate } from "@/lib/pricing/estimate";
import { PRIORITIES } from "@/lib/scope/schema";

const SECTION = "mt-14";
// Written out in full: Tailwind only generates classes it can find literally in the source.
const SWATCH = { must: "bg-must", should: "bg-should", could: "bg-could" } as const;
const H2 = "text-2xl font-bold tracking-tight";

function Tier({ name, detail, tier, currency }: { name: string; detail: string; tier: TierEstimate; currency: string }) {
  return (
    <div>
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-ink-soft">{detail}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {formatMoneyRange(tier.priceLow, tier.priceHigh, currency)}
      </p>
      <p className="mt-1 text-lg">{formatWeeks(tier.weeksLow, tier.weeksHigh)}</p>
    </div>
  );
}

export function ScopeView({ stored }: { stored: StoredScope }) {
  const { scope, estimate } = stored;
  const { assumptions: rates } = estimate;
  const scopedOn = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(stored.createdAt));
  let sweepIndex = 0;

  return (
    <article className="mt-8">
      <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.025em] sm:text-6xl">{scope.projectTitle}</h1>
      <p className="mt-5 max-w-[62ch] text-xl leading-relaxed">{scope.summary}</p>
      <p className="mt-3 text-ink-soft">
        {PROJECT_TYPE_LABELS[scope.projectType]}, scoped on {scopedOn}.
      </p>

      <section aria-labelledby="price-heading" className="mt-10 rounded-md border-2 border-ink bg-white p-6 shadow-[4px_4px_0_0_var(--color-ink)] sm:p-8">
        <h2 id="price-heading" className="sr-only">
          Price and timeline
        </h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <Tier name="First version" detail="The must-haves, ready to launch" tier={estimate.mvp} currency={rates.currency} />
          <Tier name="Full build" detail="Everything listed below" tier={estimate.full} currency={rates.currency} />
        </div>
        <p className="mt-6 border-t border-rule pt-4 text-sm leading-relaxed text-ink-soft">
          A rough estimate from assumed rates: {formatMoneyRange(rates.hourlyRate, rates.hourlyRate, rates.currency)} an
          hour, plus {Math.round(rates.overheadPct * 100)}% for project management and testing and a{" "}
          {Math.round(rates.contingencyPct * 100)}% buffer for the risks below. A call firms it up.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        {/* A plain link, not next/link: the browser should download the file, not navigate. */}
        <a
          href={`/api/scope/${stored.id}/pdf`}
          download
          className="rounded-md border-2 border-pen px-5 py-2.5 font-bold text-pen hover:bg-pen hover:text-white"
        >
          Download PDF
        </a>
      </div>

      <section aria-labelledby="features-heading" className={SECTION}>
        <h2 id="features-heading" className={H2}>
          What we&apos;d build
        </h2>
        {PRIORITIES.map((priority) => {
          const features = scope.features.filter((f) => f.priority === priority);
          if (features.length === 0) return null;
          return (
            <div key={priority} className="mt-8">
              <h3 className="flex items-center gap-2 font-semibold text-ink-soft">
                <span aria-hidden className={`inline-block size-3.5 rounded-sm ${SWATCH[priority]}`} />
                {PRIORITY_LABELS[priority]}
              </h3>
              <ul className="mt-3 space-y-5">
                {features.map((f) => (
                  <li key={f.name}>
                    <p className="text-lg font-semibold">
                      <span
                        className={`highlight highlight-${priority}${priority === "must" ? " highlight-sweep" : ""}`}
                        style={priority === "must" ? ({ "--i": sweepIndex++ } as React.CSSProperties) : undefined}
                      >
                        {f.name}
                      </span>
                    </p>
                    <p className="mt-1 max-w-[62ch] leading-relaxed">{f.description}</p>
                    <p className="mt-1 text-sm text-ink-soft">{FEATURE_TYPE_LABELS[f.type]}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {scope.integrations.length > 0 && (
        <section aria-labelledby="integrations-heading" className={SECTION}>
          <h2 id="integrations-heading" className={H2}>
            What it connects to
          </h2>
          <ul className="mt-5 space-y-4">
            {scope.integrations.map((i) => (
              <li key={i.name}>
                <p className="font-semibold">{i.name}</p>
                <p className="max-w-[62ch] leading-relaxed">{i.purpose}</p>
                <p className="text-sm text-ink-soft">{INTEGRATION_TYPE_LABELS[i.type]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="risks-heading" className={SECTION}>
        <h2 id="risks-heading" className={H2}>
          Risks
        </h2>
        <ul className="mt-5 space-y-6">
          {scope.risks.map((r) => (
            <li key={r.title}>
              <p className="font-semibold">
                {r.title}
                <span className={`ml-3 text-sm ${r.severity === "high" ? "font-bold" : "font-normal text-ink-soft"}`}>
                  {SEVERITY_LABELS[r.severity]}
                </span>
              </p>
              <p className="mt-1 max-w-[62ch] leading-relaxed">{r.detail}</p>
              <p className="mt-1 max-w-[62ch] leading-relaxed text-ink-soft">What helps: {r.mitigation}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="plan-heading" className={SECTION}>
        <h2 id="plan-heading" className={H2}>
          Delivery plan
        </h2>
        <ol className="mt-5 space-y-6">
          {scope.milestones.map((m, index) => {
            const timing = estimate.milestones[index];
            return (
              <li key={m.name} className="grid grid-cols-[2.5rem_1fr]">
                <span className="text-2xl font-extrabold text-ink-soft">{index + 1}</span>
                <div>
                  <p className="font-semibold">
                    {m.name}
                    {timing && timing.hoursHigh > 0 && (
                      <span className="ml-3 text-sm font-normal text-ink-soft">
                        {formatWeeks(timing.weeksLow, timing.weeksHigh)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 max-w-[62ch] leading-relaxed">{m.goal}</p>
                  {m.featureNames.length > 0 && (
                    <p className="mt-1 text-sm text-ink-soft">{m.featureNames.join(", ")}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className={`${SECTION} grid gap-10 sm:grid-cols-2`}>
        <section aria-labelledby="assumptions-heading">
          <h2 id="assumptions-heading" className={H2}>
            What we assumed
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
            {scope.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="questions-heading">
          <h2 id="questions-heading" className={H2}>
            Questions for a first call
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
            {scope.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>
      </div>

      <details className={`${SECTION} border-t-2 border-ink pt-6`}>
        <summary className="cursor-pointer text-lg font-bold">The brief you pasted</summary>
        <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-ink-soft">{stored.brief}</p>
      </details>
    </article>
  );
}
