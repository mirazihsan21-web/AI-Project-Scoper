import { LeadForm } from "@/components/LeadForm";
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

const SECTION = "mt-14 first:mt-0";
const H2 = "text-2xl font-bold tracking-tight";
// Written out in full: Tailwind only generates classes it can find literally in the source.
const SWATCH = { must: "bg-must", should: "bg-should", could: "bg-could" } as const;
const SEVERITY_PILL = {
  low: "bg-should/60 text-forest",
  medium: "bg-must/60 text-forest",
  high: "bg-alert text-white",
} as const;

function Tier({ name, detail, tier, currency }: { name: string; detail: string; tier: TierEstimate; currency: string }) {
  return (
    <div>
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-sm text-moss">{detail}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">{formatMoneyRange(tier.priceLow, tier.priceHigh, currency)}</p>
      <p className="mt-0.5">{formatWeeks(tier.weeksLow, tier.weeksHigh)}</p>
    </div>
  );
}

export function ScopeView({ stored }: { stored: StoredScope }) {
  const { scope, estimate } = stored;
  const { assumptions: rates } = estimate;
  const scopedOn = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(stored.createdAt));
  let sweepIndex = 0;

  return (
    <article className="mt-6">
      <header className="max-w-4xl">
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.025em] sm:text-5xl xl:text-6xl">
          {scope.projectTitle}
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed sm:text-xl">{scope.summary}</p>
        <p className="mt-3 text-moss">
          {PROJECT_TYPE_LABELS[scope.projectType]}, scoped on {scopedOn}.
        </p>
      </header>

      {/* Price first on phones; on large screens it becomes a sticky sidebar beside the details. */}
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <aside className="lg:col-start-2 lg:row-start-1">
          <section aria-labelledby="price-heading" className="leaf p-6 sm:p-7 lg:sticky lg:top-6">
            <h2 id="price-heading" className="sr-only">
              Price and timeline
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <Tier name="First version" detail="The must-haves, ready to launch" tier={estimate.mvp} currency={rates.currency} />
              <Tier name="Full build" detail="Everything listed below" tier={estimate.full} currency={rates.currency} />
            </div>
            <p className="mt-6 border-t border-rule pt-4 text-sm leading-relaxed text-moss">
              A rough estimate from assumed rates: {formatMoneyRange(rates.hourlyRate, rates.hourlyRate, rates.currency)}{" "}
              an hour, plus {Math.round(rates.overheadPct * 100)}% for project management and testing and a{" "}
              {Math.round(rates.contingencyPct * 100)}% buffer for the risks. A call firms it up.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="#book"
                className="rounded-full bg-fern px-5 py-3 text-center font-bold text-white hover:bg-fern-dark"
              >
                Book a call
              </a>
              {/* A plain link, not next/link: the browser should download the file, not navigate. */}
              <a
                href={`/api/scope/${stored.id}/pdf`}
                download
                className="rounded-full border-2 border-fern px-5 py-2.5 text-center font-bold text-fern hover:bg-fern hover:text-white"
              >
                Download PDF
              </a>
            </div>
          </section>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <section aria-labelledby="features-heading" className={SECTION}>
            <h2 id="features-heading" className={H2}>
              What we&apos;d build
            </h2>
            {PRIORITIES.map((priority) => {
              const features = scope.features.filter((f) => f.priority === priority);
              if (features.length === 0) return null;
              return (
                <div key={priority} className="mt-7">
                  <h3 className="flex items-center gap-2 font-semibold text-moss">
                    <span aria-hidden className={`inline-block size-3.5 rounded-full ${SWATCH[priority]}`} />
                    {PRIORITY_LABELS[priority]}
                  </h3>
                  <ul className="mt-3 grid gap-5 md:grid-cols-2">
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
                        <p className="mt-1 leading-relaxed">{f.description}</p>
                        <p className="mt-1 text-sm text-moss">{FEATURE_TYPE_LABELS[f.type]}</p>
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
              <ul className="mt-5 grid gap-5 md:grid-cols-2">
                {scope.integrations.map((i) => (
                  <li key={i.name}>
                    <p className="font-semibold">{i.name}</p>
                    <p className="leading-relaxed">{i.purpose}</p>
                    <p className="text-sm text-moss">{INTEGRATION_TYPE_LABELS[i.type]}</p>
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
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">
                    {r.title}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${SEVERITY_PILL[r.severity]}`}>
                      {SEVERITY_LABELS[r.severity]}
                    </span>
                  </p>
                  <p className="mt-1 max-w-[62ch] leading-relaxed">{r.detail}</p>
                  <p className="mt-1 max-w-[62ch] leading-relaxed text-moss">What helps: {r.mitigation}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="plan-heading" className={SECTION}>
            <h2 id="plan-heading" className={H2}>
              Delivery plan
            </h2>
            {/* A growth line: numbered steps joined like a vine, because milestones are a real sequence. */}
            <ol className="mt-6">
              {scope.milestones.map((m, index) => {
                const timing = estimate.milestones[index];
                const last = index === scope.milestones.length - 1;
                return (
                  <li key={m.name} className={`relative grid grid-cols-[2.25rem_1fr] gap-x-4 ${last ? "" : "pb-8"}`}>
                    {!last && (
                      <span aria-hidden className="absolute bottom-0 left-[1.125rem] top-10 w-0.5 -translate-x-1/2 bg-should" />
                    )}
                    <span className="flex size-9 items-center justify-center rounded-full bg-fern font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="pt-1">
                      <p className="flex flex-wrap items-baseline gap-x-3 font-semibold">
                        {m.name}
                        {timing && timing.hoursHigh > 0 && (
                          <span className="text-sm font-normal text-moss">
                            {formatWeeks(timing.weeksLow, timing.weeksHigh)}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 max-w-[62ch] leading-relaxed">{m.goal}</p>
                      {m.featureNames.length > 0 && (
                        <p className="mt-1 text-sm text-moss">{m.featureNames.join(", ")}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <div className={`${SECTION} grid gap-10 md:grid-cols-2`}>
            <section aria-labelledby="assumptions-heading">
              <h2 id="assumptions-heading" className={H2}>
                What we assumed
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed marker:text-fern">
                {scope.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="questions-heading">
              <h2 id="questions-heading" className={H2}>
                Questions for a first call
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed marker:text-fern">
                {scope.openQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          </div>

          <section id="book" aria-labelledby="book-heading" className={`${SECTION} leaf scroll-mt-8 p-6 sm:p-8`}>
            <h2 id="book-heading" className={H2}>
              Book a call
            </h2>
            <p className="mt-3 max-w-[60ch] text-lg leading-relaxed">
              Leave your details and we&apos;ll email you to find a time. This scope comes with your request, so you
              won&apos;t have to explain the project twice.
            </p>
            <LeadForm scopeId={stored.id} />
          </section>

          <details className={`${SECTION} border-t border-rule pt-6`}>
            <summary className="cursor-pointer text-lg font-bold">The brief you pasted</summary>
            <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-moss">{stored.brief}</p>
          </details>
        </div>
      </div>
    </article>
  );
}
