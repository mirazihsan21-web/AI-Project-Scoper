import { describe, expect, it } from "vitest";
import type { StoredScope } from "@/lib/db/scopes";
import { buildLeadEmail } from "@/lib/email/lead-email";
import { formatMoneyRange } from "@/lib/format";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { estimate } from "@/lib/pricing/estimate";
import { FAKE_SCOPE } from "@/lib/scope/fake";

const stored: StoredScope = {
  id: "11111111-1111-4111-8111-111111111111",
  createdAt: "2026-10-19T04:00:00.000Z",
  brief: "brief",
  scope: FAKE_SCOPE,
  estimate: estimate(FAKE_SCOPE, PRICING_CONFIG),
  model: "test",
  latencyMs: 1,
  inputTokens: 1,
  outputTokens: 1,
};
const scopeUrl = "https://scoper.example/s/11111111-1111-4111-8111-111111111111";
const lead = { id: 7, scopeId: stored.id, name: "Ada Lovelace", email: "ada@example.com", company: "Acme", notes: "Call after 3pm" };

describe("buildLeadEmail", () => {
  it("names the lead and the project in the subject", () => {
    expect(buildLeadEmail({ lead, stored, scopeUrl }).subject).toBe(
      "New call request from Ada Lovelace: Gym Class Booking App",
    );
  });

  it("gives the owner the contact details, prices and a link to the scope in both versions", () => {
    const { text, html } = buildLeadEmail({ lead, stored, scopeUrl });
    const mvp = formatMoneyRange(stored.estimate.mvp.priceLow, stored.estimate.mvp.priceHigh, "USD");

    for (const body of [text, html]) {
      for (const part of ["Ada Lovelace", "ada@example.com", "Acme", "Call after 3pm", mvp, scopeUrl]) {
        expect(body).toContain(part);
      }
    }
  });

  it("leaves out company and notes when the visitor left them blank", () => {
    const { text } = buildLeadEmail({ lead: { ...lead, company: null, notes: null }, stored, scopeUrl });

    expect(text).not.toContain("Company:");
    expect(text).not.toContain("Notes:");
  });

  it("escapes HTML the visitor typed, so it cannot inject markup into the owner's inbox", () => {
    const { html } = buildLeadEmail({
      lead: { ...lead, name: '<img src=x onerror="alert(1)">', notes: "<script>steal()</script>" },
      stored,
      scopeUrl,
    });

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;steal()&lt;/script&gt;");
  });
});
