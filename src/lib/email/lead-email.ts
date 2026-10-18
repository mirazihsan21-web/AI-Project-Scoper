import type { NewLead } from "@/lib/db/leads";
import type { StoredScope } from "@/lib/db/scopes";
import { formatMoneyRange, formatWeeks } from "@/lib/format";
import type { TierEstimate } from "@/lib/pricing/estimate";

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Everything a visitor typed goes through this before it reaches the HTML email. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

type LeadEmailInput = { lead: NewLead & { id: number }; stored: StoredScope; scopeUrl: string };

/** The owner's notification for a new call request, as plain text and HTML. */
export function buildLeadEmail({ lead, stored, scopeUrl }: LeadEmailInput) {
  const { scope, estimate } = stored;
  const currency = estimate.assumptions.currency;
  const tier = (t: TierEstimate) => `${formatMoneyRange(t.priceLow, t.priceHigh, currency)}, ${formatWeeks(t.weeksLow, t.weeksHigh)}`;

  const details: [string, string | null | undefined][] = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Company", lead.company],
  ];
  const filled = details.filter((d): d is [string, string] => Boolean(d[1]));

  const subject = `New call request from ${lead.name}: ${scope.projectTitle}`;

  const text = [
    "New call request from Scoper",
    "",
    ...filled.map(([label, value]) => `${label}: ${value}`),
    ...(lead.notes ? ["", "Notes:", lead.notes] : []),
    "",
    `Scope: ${scope.projectTitle}`,
    `First version: ${tier(estimate.mvp)}`,
    `Full build: ${tier(estimate.full)}`,
    `View online: ${scopeUrl}`,
    "",
    `The scope PDF is attached. Reply to this email to answer ${lead.name} directly.`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="font-family: Arial, sans-serif; color: #1e2638; line-height: 1.5;">
<h1 style="font-size: 20px;">New call request</h1>
<table cellpadding="4" style="border-collapse: collapse;">
${filled.map(([label, value]) => `<tr><td style="color: #545c6e;">${label}</td><td>${escapeHtml(value)}</td></tr>`).join("\n")}
</table>
${lead.notes ? `<h2 style="font-size: 16px;">Notes</h2>\n<p style="white-space: pre-wrap;">${escapeHtml(lead.notes)}</p>` : ""}
<h2 style="font-size: 16px;">${escapeHtml(scope.projectTitle)}</h2>
<p>First version: ${escapeHtml(tier(estimate.mvp))}<br>Full build: ${escapeHtml(tier(estimate.full))}</p>
<p><a href="${escapeHtml(scopeUrl)}" style="color: #2b44d6;">View the scope online</a> (${escapeHtml(scopeUrl)})</p>
<p style="color: #545c6e;">The scope PDF is attached. Reply to this email to answer ${escapeHtml(lead.name)} directly.</p>
</body></html>`;

  return { subject, text, html };
}
