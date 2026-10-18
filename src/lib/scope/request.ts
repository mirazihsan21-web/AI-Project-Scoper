import { z } from "zod";
import type { RateLimitResult } from "@/lib/db/rate-limit";
import type { NewScope } from "@/lib/db/scopes";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { estimate } from "@/lib/pricing/estimate";
import { AllModelsBusyError, BriefRejectedError, ScopeGenerationError, type GenerateResult } from "./generate";

export const MIN_BRIEF_LENGTH = 20;
export const MAX_BRIEF_LENGTH = 10_000;

const BriefInput = z.object(
  {
    brief: z
      .string({ error: "Paste your brief as text." })
      .trim()
      .min(1, "Paste your brief first.")
      .min(MIN_BRIEF_LENGTH, `Add a bit more detail: at least ${MIN_BRIEF_LENGTH} characters.`)
      .max(MAX_BRIEF_LENGTH, "That brief is too long. Keep it under 10,000 characters."),
  },
  { error: "Paste your brief first." },
);

export type ScopeRequestDeps = {
  /** Checks and records this visitor's request against the hourly limit. */
  checkLimit: () => Promise<RateLimitResult>;
  generate: (brief: string) => Promise<GenerateResult>;
  save: (scope: NewScope) => Promise<string>;
};

export type ScopeRequestResult = {
  status: number;
  body: { id: string } | { error: string };
  retryAfterSeconds?: number;
};

const fail = (status: number, error: string, retryAfterSeconds?: number): ScopeRequestResult => ({
  status,
  body: { error },
  ...(retryAfterSeconds !== undefined && { retryAfterSeconds }),
});

/** The whole POST /api/scope flow, kept free of Next.js so every outcome can be unit tested. */
export async function handleScopeRequest(body: unknown, deps: ScopeRequestDeps): Promise<ScopeRequestResult> {
  // Validate first, so a typo never uses up the visitor's hourly quota.
  const parsed = BriefInput.safeParse(body);
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Paste your brief first.");
  const { brief } = parsed.data;

  const limit = await deps.checkLimit();
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterMs / 60_000);
    return fail(
      429,
      `You've reached this hour's limit for new scopes. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      Math.ceil(limit.retryAfterMs / 1000),
    );
  }

  try {
    const result = await deps.generate(brief);
    const id = await deps.save({
      brief,
      scope: result.scope,
      estimate: estimate(result.scope, PRICING_CONFIG),
      model: result.model,
      latencyMs: result.latencyMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
    return { status: 201, body: { id } };
  } catch (error) {
    if (error instanceof BriefRejectedError) {
      return fail(
        422,
        "Your brief includes text that reads like instructions to the AI. Remove it and describe the project you want built.",
      );
    }
    if (error instanceof AllModelsBusyError) {
      const seconds = Math.ceil(error.retryAfterMs / 1000);
      return fail(503, `Scoper is busy right now. Try again in ${seconds} seconds.`, seconds);
    }
    if (error instanceof ScopeGenerationError) {
      console.error("Scope generation failed:", error.message);
      return fail(
        502,
        "We couldn't turn that brief into a scope. Add who will use it and what they need to do, then try again.",
      );
    }
    console.error("Unexpected error in /api/scope:", error);
    return fail(500, "Something went wrong on our side. Try again in a minute.");
  }
}
