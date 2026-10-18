import { describe, expect, it, vi } from "vitest";
import type { NewLead } from "@/lib/db/leads";
import type { StoredScope } from "@/lib/db/scopes";
import { handleLeadRequest, MAX_LEADS_PER_SCOPE, type LeadRequestDeps } from "@/lib/leads/request";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { estimate } from "@/lib/pricing/estimate";
import { sampleScope } from "../fixtures/scope";

const SCOPE_ID = "11111111-1111-4111-8111-111111111111";
const stored: StoredScope = {
  id: SCOPE_ID,
  createdAt: "2026-10-19T04:00:00.000Z",
  brief: "brief",
  scope: sampleScope,
  estimate: estimate(sampleScope, PRICING_CONFIG),
  model: "test",
  latencyMs: 1,
  inputTokens: 1,
  outputTokens: 1,
};
const VALID = { scopeId: SCOPE_ID, name: " Ada Lovelace ", email: " ada@example.com ", company: "Acme", notes: "" };

function deps(overrides: Partial<LeadRequestDeps> = {}) {
  const calls = { saved: [] as NewLead[], notified: [] as number[], marked: [] as number[] };
  const d: LeadRequestDeps = {
    getScope: async (id) => (id === SCOPE_ID ? stored : null),
    countLeads: async () => 0,
    saveLead: async (lead) => {
      calls.saved.push(lead);
      return 42;
    },
    notify: async (lead) => {
      calls.notified.push(lead.id);
    },
    markNotified: async (id) => {
      calls.marked.push(id);
    },
    ...overrides,
  };
  return { d, calls };
}

describe("handleLeadRequest", () => {
  it("saves the lead, emails the owner and marks it notified", async () => {
    const { d, calls } = deps();

    const result = await handleLeadRequest(VALID, d);

    expect(result).toEqual({ status: 201, body: { ok: true } });
    expect(calls.saved).toEqual([
      { scopeId: SCOPE_ID, name: "Ada Lovelace", email: "ada@example.com", company: "Acme", notes: null },
    ]);
    expect(calls.notified).toEqual([42]);
    expect(calls.marked).toEqual([42]);
  });

  it.each([
    ["no body", undefined],
    ["a missing name", { ...VALID, name: "  " }],
    ["an invalid email", { ...VALID, email: "ada-at-example" }],
    ["a scope id that is not a uuid", { ...VALID, scopeId: "abc" }],
    ["notes over 5,000 characters", { ...VALID, notes: "x".repeat(5001) }],
    // The name goes into the email subject; a line break there could be used to forge headers.
    ["a name containing a line break", { ...VALID, name: "Ada\r\nBcc: victim@example.com" }],
  ])("rejects %s with 400 and saves nothing", async (_label, body) => {
    const { d, calls } = deps();

    const result = await handleLeadRequest(body, d);

    expect(result.status).toBe(400);
    expect(result.body).toHaveProperty("error");
    expect(calls.saved).toEqual([]);
  });

  it("pretends to succeed for bots that fill the hidden field, without saving or emailing", async () => {
    const { d, calls } = deps();

    const result = await handleLeadRequest({ ...VALID, website: "http://spam.example" }, d);

    expect(result).toEqual({ status: 201, body: { ok: true } });
    expect(calls.saved).toEqual([]);
    expect(calls.notified).toEqual([]);
  });

  it("returns 404 when the scope does not exist", async () => {
    const { d, calls } = deps();

    const result = await handleLeadRequest({ ...VALID, scopeId: "22222222-2222-4222-8222-222222222222" }, d);

    expect(result.status).toBe(404);
    expect(calls.saved).toEqual([]);
  });

  it(`stops at ${MAX_LEADS_PER_SCOPE} leads per scope so one link cannot flood the inbox`, async () => {
    const { d, calls } = deps({ countLeads: async () => MAX_LEADS_PER_SCOPE });

    const result = await handleLeadRequest(VALID, d);

    expect(result.status).toBe(429);
    expect(calls.saved).toEqual([]);
  });

  it("still confirms a saved lead when the email fails, leaving it unmarked for a resend", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, calls } = deps({
      notify: async () => {
        throw new Error("Resend is down");
      },
    });

    const result = await handleLeadRequest(VALID, d);

    expect(result).toEqual({ status: 201, body: { ok: true } });
    expect(calls.saved).toHaveLength(1);
    expect(calls.marked).toEqual([]);
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});
