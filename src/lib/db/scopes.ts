import type { Estimate } from "@/lib/pricing/estimate";
import type { Scope } from "@/lib/scope/schema";
import type { Db } from "./client";

export type NewScope = {
  brief: string;
  scope: Scope;
  estimate: Estimate;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
};

export type StoredScope = NewScope & { id: string; createdAt: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function insertScope(db: Db, s: NewScope): Promise<string> {
  const { data, error } = await db
    .from("scopes")
    .insert({
      brief: s.brief,
      scope: s.scope,
      estimate: s.estimate,
      model: s.model,
      latency_ms: s.latencyMs,
      input_tokens: s.inputTokens,
      output_tokens: s.outputTokens,
    })
    .select("id")
    .single();
  if (error) throw new Error(`insertScope failed: ${error.message}`);
  return data.id;
}

/** Returns null for unknown or malformed ids, so a bad share link is a 404, not a 500. */
export async function getScope(db: Db, id: string): Promise<StoredScope | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db.from("scopes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getScope failed: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    createdAt: data.created_at,
    brief: data.brief,
    // Written by insertScope after validation; not re-validated so old scopes stay viewable if the schema evolves.
    scope: data.scope as unknown as Scope,
    estimate: data.estimate as unknown as Estimate,
    model: data.model,
    latencyMs: data.latency_ms,
    inputTokens: data.input_tokens,
    outputTokens: data.output_tokens,
  };
}
