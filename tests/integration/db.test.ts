// Runs against the real Supabase project in .env.local: `npm run test:integration`.
// Every row created here is deleted in afterAll.
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";
import type { Db } from "@/lib/db/client";
import { insertLead, markLeadNotified } from "@/lib/db/leads";
import { checkRateLimit, hashIp } from "@/lib/db/rate-limit";
import { getScope, insertScope, type NewScope } from "@/lib/db/scopes";
import type { Database } from "@/lib/db/types";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { estimate } from "@/lib/pricing/estimate";
import { FAKE_SCOPE } from "@/lib/scope/fake";

const url = process.env.SUPABASE_URL!;
const db: Db = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient<Database>(url, process.env.SUPABASE_PUBLISHABLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const runId = `it-${Date.now()}`;
const createdScopeIds: string[] = [];
const createdIpHashes: string[] = [];

const newScope = (): NewScope => ({
  brief: `integration test ${runId}`,
  scope: FAKE_SCOPE,
  estimate: estimate(FAKE_SCOPE, PRICING_CONFIG),
  model: "test/fake",
  latencyMs: 1234,
  inputTokens: 10,
  outputTokens: 20,
});

async function createScope() {
  const id = await insertScope(db, newScope());
  createdScopeIds.push(id);
  return id;
}

afterAll(async () => {
  // Leads go with their scope (on delete cascade).
  if (createdScopeIds.length) await db.from("scopes").delete().in("id", createdScopeIds);
  if (createdIpHashes.length) await db.from("scope_requests").delete().in("ip_hash", createdIpHashes);
});

describe("scopes", () => {
  it("stores a scope and reads back the same scope and estimate", async () => {
    const input = newScope();
    const id = await insertScope(db, input);
    createdScopeIds.push(id);

    const stored = await getScope(db, id);

    expect(stored).toMatchObject({ id, brief: input.brief, model: "test/fake", latencyMs: 1234 });
    expect(stored!.scope).toEqual(FAKE_SCOPE);
    expect(stored!.estimate).toEqual(input.estimate);
  });

  it.each([
    ["an unknown uuid", "00000000-0000-4000-8000-000000000000"],
    ["a malformed id", "not-a-uuid'; drop table scopes;--"],
  ])("returns null for %s", async (_label, id) => {
    expect(await getScope(db, id)).toBeNull();
  });
});

describe("leads", () => {
  it("saves a lead against its scope and marks it notified", async () => {
    const scopeId = await createScope();

    const leadId = await insertLead(db, { scopeId, name: "Ada", email: "ada@example.com", company: "Acme", notes: null });
    await markLeadNotified(db, leadId);

    const { data } = await db.from("leads").select("scope_id, email, notified_at").eq("id", leadId).single();
    expect(data).toMatchObject({ scope_id: scopeId, email: "ada@example.com" });
    expect(data!.notified_at).not.toBeNull();
  });

  it("rejects a lead for a scope that does not exist", async () => {
    await expect(
      insertLead(db, { scopeId: "00000000-0000-4000-8000-000000000000", name: "X", email: "x@example.com" }),
    ).rejects.toThrow();
  });
});

describe("checkRateLimit", () => {
  it("allows up to the limit per visitor, then blocks only that visitor", async () => {
    const visitor = hashIp(`198.51.100.1-${runId}`, "test");
    const other = hashIp(`198.51.100.2-${runId}`, "test");
    createdIpHashes.push(visitor, other);
    const opts = () => ({ limit: 2, windowMs: 60_000, now: Date.now() });

    const results = [];
    for (let i = 0; i < 3; i++) results.push(await checkRateLimit(db, visitor, opts()));

    expect(results.map((r) => r.allowed)).toEqual([true, true, false]);
    expect(results[2].retryAfterMs).toBeGreaterThan(0);
    expect((await checkRateLimit(db, other, opts())).allowed).toBe(true);
  });
});

describe("public API access (publishable key)", () => {
  // Two layers: no grants (42501 here) and RLS with no policies underneath. Requiring 42501 means
  // losing the outer layer fails this test, even though RLS alone would still return zero rows.
  it.each(["scopes", "leads", "scope_requests"] as const)("cannot read %s", async (table) => {
    await createScope(); // make sure there is at least one row to leak
    const { data, error } = await anon.from(table).select("*").limit(1);
    expect(error?.code).toBe("42501");
    expect(data).toBeNull();
  });

  it("cannot insert a scope", async () => {
    const s = newScope();
    const { error } = await anon.from("scopes").insert({
      brief: s.brief,
      scope: s.scope,
      estimate: s.estimate,
      model: s.model,
      latency_ms: 1,
      input_tokens: 1,
      output_tokens: 1,
    });
    expect(error).not.toBeNull();
  });
});
