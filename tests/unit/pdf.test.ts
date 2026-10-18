import { extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import type { StoredScope } from "@/lib/db/scopes";
import { formatMoneyRange } from "@/lib/format";
import { pdfFilename, renderScopePdf } from "@/lib/pdf/render";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { estimate } from "@/lib/pricing/estimate";
import { FAKE_SCOPE } from "@/lib/scope/fake";

const stored: StoredScope = {
  id: "11111111-1111-4111-8111-111111111111",
  createdAt: "2026-10-19T04:00:00.000Z",
  brief: "gym app brief",
  scope: FAKE_SCOPE,
  estimate: estimate(FAKE_SCOPE, PRICING_CONFIG),
  model: "test/fake",
  latencyMs: 1,
  inputTokens: 1,
  outputTokens: 1,
};

async function pdfText(pdf: Uint8Array) {
  const doc = await getDocumentProxy(new Uint8Array(pdf));
  const { text, totalPages } = await extractText(doc, { mergePages: true });
  // react-pdf may break a line into several text runs; collapse whitespace so phrases match.
  return { text: text.replace(/\s+/g, " "), totalPages };
}

describe("renderScopePdf", () => {
  it("produces a PDF containing the scope, its price and a link back to it", async () => {
    const pdf = await renderScopePdf(stored, "https://scoper.example");

    expect(new TextDecoder().decode(pdf.subarray(0, 5))).toBe("%PDF-");
    const { text, totalPages } = await pdfText(pdf);
    expect(totalPages).toBeGreaterThanOrEqual(1);
    expect(text).toContain("Gym Class Booking App");
    for (const heading of ["Must have", "Should have", "Could have", "Delivery plan", "Risks"]) {
      expect(text).toContain(heading);
    }
    for (const feature of FAKE_SCOPE.features) expect(text).toContain(feature.name);
    const { mvp } = stored.estimate;
    expect(text).toContain(formatMoneyRange(mvp.priceLow, mvp.priceHigh, "USD"));
    expect(text).toContain("https://scoper.example/s/11111111-1111-4111-8111-111111111111");
  });
});

describe("pdfFilename", () => {
  it.each([
    ["Yoga Studio Online Booking & Payments", "yoga-studio-online-booking-payments-scope.pdf"],
    ["Café Ordering – v2!", "cafe-ordering-v2-scope.pdf"],
    ["   ", "project-scope.pdf"],
  ])("%j → %s", (title, want) => {
    expect(pdfFilename(title)).toBe(want);
  });
});
