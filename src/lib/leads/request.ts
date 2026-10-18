import { z } from "zod";
import type { NewLead } from "@/lib/db/leads";
import type { StoredScope } from "@/lib/db/scopes";

/** One share link can only produce this many call requests, so it cannot be used to flood the owner's inbox. */
export const MAX_LEADS_PER_SCOPE = 3;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max.toLocaleString("en-US")} characters.`)
    .optional()
    .transform((value) => value || null);

const LeadInput = z.object(
  {
    scopeId: z.uuid({ error: "This scope link looks broken. Reload the page and try again." }),
    name: z.string({ error: "Add your name." }).trim().min(1, "Add your name.").max(200, "Keep your name under 200 characters."),
    email: z
      .string({ error: "Add your email address." })
      .trim()
      .pipe(z.email({ error: "Enter a valid email address." }).max(320, "Enter a valid email address.")),
    company: optionalText(200),
    notes: optionalText(5000),
  },
  { error: "Fill in your name and email." },
);

export type LeadRequestDeps = {
  getScope: (id: string) => Promise<StoredScope | null>;
  countLeads: (scopeId: string) => Promise<number>;
  saveLead: (lead: NewLead) => Promise<number>;
  /** Emails the owner; throws if sending fails. */
  notify: (lead: NewLead & { id: number }, stored: StoredScope) => Promise<void>;
  markNotified: (id: number) => Promise<void>;
};

export type LeadRequestResult = { status: number; body: { ok: true } | { error: string } };

const OK: LeadRequestResult = { status: 201, body: { ok: true } };

/** The whole POST /api/leads flow, kept free of Next.js so every outcome can be unit tested. */
export async function handleLeadRequest(body: unknown, deps: LeadRequestDeps): Promise<LeadRequestResult> {
  // Honeypot: people never see the "website" field, bots fill it in. Answer as if it worked, so they learn nothing.
  if (body && typeof body === "object" && "website" in body && body.website) return OK;

  const parsed = LeadInput.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: parsed.error.issues[0]?.message ?? "Fill in your name and email." } };
  }
  const lead: NewLead = parsed.data;

  const stored = await deps.getScope(lead.scopeId);
  if (!stored) return { status: 404, body: { error: "This scope doesn't exist any more. Scope your brief again." } };

  if ((await deps.countLeads(lead.scopeId)) >= MAX_LEADS_PER_SCOPE) {
    return { status: 429, body: { error: "We already have call requests for this scope, so we'll be in touch soon." } };
  }

  const id = await deps.saveLead(lead);
  try {
    await deps.notify({ ...lead, id }, stored);
    await deps.markNotified(id);
  } catch (error) {
    // The lead is saved; notified_at stays null so the email can be resent. The visitor doesn't need to retry.
    console.error(`Lead ${id} saved but the notification email failed:`, error);
  }
  return OK;
}
