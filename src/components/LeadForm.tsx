"use client";

import { useId, useState, type FormEvent } from "react";

type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "sent"; name: string; email: string }
  | { kind: "error"; message: string };

const FIELD =
  "mt-1 block w-full rounded-xl border-2 border-rule bg-white px-3 py-2 text-lg font-normal text-forest placeholder:text-moss focus:border-fern disabled:opacity-60";

export function LeadForm({ scopeId }: { scopeId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const errorId = useId();
  const pending = state.kind === "pending";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setState({ kind: "pending" });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scopeId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setState({ kind: "error", message: data.error ?? "Something went wrong on our side. Try again in a minute." });
        return;
      }
      setState({ kind: "sent", name: form.name.trim(), email: form.email.trim() });
    } catch {
      setState({ kind: "error", message: "Couldn't send your request. Check your connection and try again." });
    }
  }

  if (state.kind === "sent") {
    return (
      <p role="status" className="mt-5 max-w-[60ch] text-lg leading-relaxed">
        Thanks, {state.name}. We have your request and will email {state.email} to find a time.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="font-semibold">
        Name
        <input name="name" required maxLength={200} autoComplete="name" disabled={pending} className={FIELD} />
      </label>
      <label className="font-semibold">
        Email
        <input name="email" type="email" required maxLength={320} autoComplete="email" disabled={pending} className={FIELD} />
      </label>
      <label className="font-semibold">
        Company <span className="font-normal text-moss">(optional)</span>
        <input name="company" maxLength={200} autoComplete="organization" disabled={pending} className={FIELD} />
      </label>
      <label className="font-semibold sm:col-span-2">
        Anything we should know before the call? <span className="font-normal text-moss">(optional)</span>
        <textarea name="notes" rows={3} maxLength={5000} disabled={pending} className={`${FIELD} resize-y`} />
      </label>

      {/* Honeypot: hidden from people and screen readers; bots that fill it are quietly ignored. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.kind === "error" && (
        <p id={errorId} role="alert" className="font-medium text-alert sm:col-span-2">
          {state.message}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          aria-describedby={state.kind === "error" ? errorId : undefined}
          className="w-full rounded-full bg-fern px-7 py-3 text-lg font-bold text-white hover:bg-fern-dark disabled:cursor-wait disabled:opacity-80 sm:w-auto"
        >
          {pending ? "Sending…" : "Book a call"}
        </button>
      </div>
    </form>
  );
}
