import { BriefForm } from "@/components/BriefForm";

// What a finished scope looks like, so the highlighter language is learned before the first result.
const PREVIEW = [
  { priority: "must", label: "Must have", feature: "Class booking" },
  { priority: "should", label: "Should have", feature: "Trainer schedule" },
  { priority: "could", label: "Could have", feature: "WhatsApp reminders" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
      <h1 className="max-w-[16ch] text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
        Paste the messy version. Get a scope you can act on.
      </h1>
      <p className="mt-6 max-w-[58ch] text-xl leading-relaxed text-ink-soft">
        Drop in a rough idea, a client email or notes from a call. You get the features sorted by priority, what it
        connects to, the risks, a delivery plan and a price range.
      </p>

      <BriefForm />

      <section aria-labelledby="preview-heading" className="mt-20 border-t-2 border-ink pt-8">
        <h2 id="preview-heading" className="text-2xl font-bold tracking-tight">
          What comes back
        </h2>
        <ul className="mt-5 space-y-3 text-lg">
          {PREVIEW.map((item) => (
            <li key={item.priority} className="flex flex-wrap gap-x-3">
              <span className="w-32 shrink-0 text-ink-soft">{item.label}</span>
              <span className={`highlight highlight-${item.priority} font-semibold`}>{item.feature}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
          Plus integrations, risks with what to do about them, milestones, and a price and timeline for both a first
          version and the full build.
        </p>
      </section>
    </main>
  );
}
