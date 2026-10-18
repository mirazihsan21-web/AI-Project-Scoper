"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Sprout } from "@/components/nature";
import { SAMPLE_BRIEFS } from "@/lib/samples";

const MIN = 20;
const MAX = 10_000;

// The request does not stream, so these steps pace the wait; the last one holds until it finishes.
const STEPS = ["Reading your brief", "Picking out the features", "Checking for risks", "Pricing the build"];
const STEP_MS = 1400;

export function BriefForm() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(timer);
  }, [pending]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = brief.trim();
    if (text.length < MIN) {
      setError(text ? `Add a bit more detail: at least ${MIN} characters.` : "Paste your brief first.");
      return;
    }
    setError(null);
    setStep(0);
    setPending(true);
    try {
      const response = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: text }),
      });
      const data = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "Something went wrong on our side. Try again in a minute.");
        setPending(false);
        return;
      }
      router.push(`/s/${data.id}`);
    } catch {
      setError("Couldn't reach Scoper. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="brief" className="text-lg font-bold">
        Your project brief
      </label>
      <textarea
        id="brief"
        name="brief"
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        maxLength={MAX}
        rows={9}
        disabled={pending}
        aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
        aria-invalid={error ? true : undefined}
        placeholder="Paste a client email, call notes or a WhatsApp chat. Messy is fine."
        className="mt-2 block w-full resize-y rounded-2xl border-2 border-rule bg-white px-4 py-3 text-base leading-relaxed text-forest placeholder:text-moss focus:border-fern sm:text-lg disabled:opacity-60"
      />
      <p id={hintId} className="mt-2 text-right text-sm text-moss">
        {brief.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")} characters
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-moss">No brief handy? Try</span>
        {SAMPLE_BRIEFS.map((sample) => (
          <button
            key={sample.label}
            type="button"
            disabled={pending}
            onClick={() => {
              setBrief(sample.brief);
              setError(null);
            }}
            className="rounded-full border border-fern/40 bg-white px-3 py-1 text-sm font-semibold text-fern hover:border-fern hover:bg-fern hover:text-white disabled:opacity-60"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-4 font-medium text-alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-fern px-7 py-3 text-lg font-bold text-white hover:bg-fern-dark disabled:cursor-wait disabled:opacity-90"
        >
          {pending ? "Scoping…" : "Scope my project"}
        </button>
        <p aria-live="polite" className="flex items-center gap-2 text-moss">
          {pending && <Sprout className="size-6 shrink-0" />}
          {pending ? `${STEPS[step]}…` : "Takes about 5 seconds."}
        </p>
      </div>
    </form>
  );
}
