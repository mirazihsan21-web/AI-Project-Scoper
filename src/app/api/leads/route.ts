import { getDb } from "@/lib/db/client";
import { countLeadsForScope, insertLead, markLeadNotified } from "@/lib/db/leads";
import { getScope } from "@/lib/db/scopes";
import { buildLeadEmail } from "@/lib/email/lead-email";
import { createResendSender, fakeSender, type SendEmail } from "@/lib/email/sender";
import { readJsonBody } from "@/lib/http/json-body";
import { handleLeadRequest } from "@/lib/leads/request";
import { scopePdf } from "@/lib/pdf/cached";
import { pdfFilename } from "@/lib/pdf/render";
import { scopeUrl } from "@/lib/urls";

// Far above any real request (5,000 characters of notes plus contact details is about 6 KB).
const MAX_BODY_BYTES = 16 * 1024;

export const maxDuration = 30;

function emailSender(): SendEmail {
  if (process.env.SCOPER_FAKE_EMAIL === "1") return fakeSender;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set (or set SCOPER_FAKE_EMAIL=1)");
  return createResendSender(apiKey);
}

export async function POST(request: Request) {
  const read = await readJsonBody(request, MAX_BODY_BYTES);
  if (!read.ok) return Response.json({ error: read.error }, { status: read.status });
  const { body } = read;
  const db = getDb();
  const appUrl = process.env.APP_URL || new URL(request.url).origin;

  const result = await handleLeadRequest(body, {
    getScope: (id) => getScope(db, id),
    countLeads: (id) => countLeadsForScope(db, id),
    saveLead: (lead) => insertLead(db, lead),
    notify: async (lead, stored) => {
      const to = process.env.LEAD_NOTIFY_EMAIL;
      if (!to) throw new Error("LEAD_NOTIFY_EMAIL is not set");
      const pdf = await scopePdf(stored.id, appUrl);
      if (!pdf) throw new Error(`Scope ${stored.id} disappeared before its PDF was rendered`);
      await emailSender()({
        from: process.env.RESEND_FROM || "Scoper <onboarding@resend.dev>",
        to,
        // Replying goes straight to the visitor.
        replyTo: lead.email,
        ...buildLeadEmail({ lead, stored, scopeUrl: scopeUrl(appUrl, stored.id) }),
        attachments: [{ filename: pdfFilename(stored.scope.projectTitle), content: Buffer.from(pdf) }],
      });
    },
    markNotified: (id) => markLeadNotified(db, id),
  });

  return Response.json(result.body, { status: result.status });
}
