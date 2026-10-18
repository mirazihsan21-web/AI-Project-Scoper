import { BriefForm } from "@/components/BriefForm";
import { Landscape } from "@/components/nature";

// What a finished scope looks like, so the highlighter colours are learned before the first result.
const PREVIEW = [
  { priority: "must", label: "Must have", feature: "Class booking" },
  { priority: "should", label: "Should have", feature: "Trainer schedule" },
  { priority: "could", label: "Could have", feature: "WhatsApp reminders" },
] as const;

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Intro, form, preview: stacked in that order on phones; intro and preview left, form right on large screens. */}
      <div className="mx-auto grid w-full max-w-6xl gap-x-14 gap-y-10 px-5 pb-48 pt-10 sm:px-8 sm:pb-56 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-12 lg:pt-20">
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 className="max-w-[15ch] text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
            Paste the messy version. Get a scope you can act on.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-moss sm:text-xl">
            Drop in a rough idea, a client email or notes from a call. You get the features sorted by priority, what it
            connects to, the risks, a delivery plan and a price range.
          </p>
        </div>

        <div className="leaf p-5 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <BriefForm />
        </div>

        <section aria-labelledby="preview-heading" className="lg:col-start-1 lg:row-start-2">
          <h2 id="preview-heading" className="text-xl font-bold tracking-tight">
            What comes back
          </h2>
          <ul className="mt-4 space-y-3 text-lg">
            {PREVIEW.map((item) => (
              <li key={item.priority} className="flex flex-wrap items-baseline gap-x-3">
                <span className="w-32 shrink-0 text-moss">{item.label}</span>
                <span className={`highlight highlight-${item.priority} font-semibold`}>{item.feature}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-[52ch] leading-relaxed text-moss">
            Plus integrations, risks with what to do about them, milestones, and a price and timeline for both a first
            version and the full build.
          </p>
        </section>
      </div>

      <Landscape className="absolute inset-x-0 bottom-0 h-40 sm:h-52" />
    </main>
  );
}
