import { createHash } from "node:crypto";
import type { Db } from "./client";

export type RateLimitOptions = { limit: number; windowMs: number; now: number };
export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

/** Salted SHA-256 of the visitor's IP, so rate limiting never stores the IP itself. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Given the times of a visitor's earlier requests, decides whether one more is allowed now. */
export function rateLimitDecision(requestTimes: Date[], { limit, windowMs, now }: RateLimitOptions): RateLimitResult {
  const inWindow = requestTimes.map((t) => t.getTime()).filter((t) => t > now - windowMs);
  if (inWindow.length < limit) return { allowed: true, retryAfterMs: 0 };
  const oldest = Math.min(...inWindow);
  return { allowed: false, retryAfterMs: oldest + windowMs - now };
}

/**
 * Checks a visitor's recent requests and, if allowed, records this one.
 * Check-then-insert can let a burst of parallel requests slightly exceed the limit; fine for a lead magnet.
 */
export async function checkRateLimit(db: Db, ipHash: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const { data, error } = await db
    .from("scope_requests")
    .select("created_at")
    .eq("ip_hash", ipHash)
    .gt("created_at", new Date(opts.now - opts.windowMs).toISOString())
    .order("created_at", { ascending: true })
    .limit(opts.limit);
  if (error) throw new Error(`checkRateLimit failed: ${error.message}`);

  const decision = rateLimitDecision(
    data.map((r) => new Date(r.created_at)),
    opts,
  );
  if (decision.allowed) {
    // Use the caller's clock for both reads and writes so app/DB clock skew cannot shift the window.
    const { error: insertError } = await db
      .from("scope_requests")
      .insert({ ip_hash: ipHash, created_at: new Date(opts.now).toISOString() });
    if (insertError) throw new Error(`checkRateLimit insert failed: ${insertError.message}`);
  }
  return decision;
}
