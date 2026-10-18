"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
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
    <form onSubmit={submit} className="mt-10" noValidate>
      <label htmlFor="brief" className="sr-only">
        Your project brief
      </label>
      <textarea
        id="brief"
        name="brief"
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        maxLength={MAX}
        rows={10}
        disabled={pending}
        aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
        aria-invalid={error ? true : undefined}
        placeholder="Paste a client email, call notes or a WhatsApp chat. Messy is fine."
        className="block w-full resize-y rounded-md border-2 border-ink bg-white px-4 py-3 text-lg leading-relaxed text-ink shadow-[4px_4px_0_0_var(--color-ink)] placeholder:text-ink-soft disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm text-ink-soft">
        <p>
          No brief handy? Try{" "}
          {SAMPLE_BRIEFS.map((sample, i) => (
            <span key={sample.label}>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setBrief(sample.brief);
                  setError(null);
                }}
                className="font-semibold text-pen underline decoration-2 underline-offset-4 hover:text-pen-dark disabled:opacity-60"
              >
                {sample.label}
              </button>
              {i < SAMPLE_BRIEFS.length - 2 ? ", " : i === SAMPLE_BRIEFS.length - 2 ? " or " : "."}
            </span>
          ))}
        </p>
        <p id={hintId}>
          {brief.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")} characters
        </p>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-4 font-medium text-alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-pen px-6 py-3 text-lg font-bold text-white hover:bg-pen-dark disabled:cursor-wait disabled:opacity-80"
        >
          {pending ? "Scoping…" : "Scope my project"}
        </button>
        <p aria-live="polite" className="text-ink-soft">
          {pending ? `${STEPS[step]}…` : "Takes about 5 seconds."}
        </p>
      </div>
    </form>
  );
}
