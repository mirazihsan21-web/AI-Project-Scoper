# Scoper: AI Project Scoper

Paste a rough project brief (an idea, a client email, call notes or a WhatsApp chat) and get a structured scope back:
features sorted by priority (must / should / could), integrations, risks, a delivery plan, and a price and timeline
range for a first version and the full build. Visitors can download the scope as a PDF or book a call, which saves the
lead and emails it to the owner with the PDF attached.

## How it works

1. **Screen the brief.** Groq's `llama-prompt-guard-2` checks it for prompt-injection attempts (fails open if unavailable).
2. **Generate the scope.** A chain of three Groq models (`gpt-oss-120b` → `gpt-oss-20b` → `qwen3.8-27b`) in strict
   JSON-schema mode. A rate-limited or failing model hands over to the next one; the output is validated again with Zod.
3. **Price it in code, not by the model.** The model only classifies each feature into a fixed catalogue
   (booking, checkout, payments, AI assistant, …). Hours per type live in `src/lib/pricing/config.ts`, so prices are
   consistent across models and easy to tune. The rates are assumptions until real project data replaces them.
4. **Store and share.** Supabase stores scopes, leads and hashed rate-limit entries. Each scope gets an unguessable
   share link and a server-rendered PDF.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Zod · Groq · Supabase (Postgres, RLS, pg_cron) ·
@react-pdf/renderer · Resend · Vitest · Playwright

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys (see below)
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq API key for scope generation and the injection guard |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Server-side database access (the secret key never reaches the browser) |
| `SUPABASE_PUBLISHABLE_KEY` | Only used by the integration tests, to prove the public API can't read the tables |
| `IP_HASH_SALT` | Random string; visitor IPs are stored only as salted hashes |
| `RESEND_API_KEY`, `RESEND_FROM`, `LEAD_NOTIFY_EMAIL` | Lead notification emails |
| `APP_URL` | Public base URL for links in emails and PDFs |
| `SCOPER_FAKE_LLM=1`, `SCOPER_FAKE_EMAIL=1` | Run without Groq quota or real email (used by e2e tests) |

Database schema: `supabase/migrations/` (apply with the Supabase CLI: `npx supabase db push --linked`).

In VS Code, press F5 and pick **Run Scoper** or **Run Scoper (fake AI + email)**.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:integration` | Tests against the real Supabase project in `.env.local` |
| `npm run e2e` | Browser tests (Playwright) against a production build, with fake AI and email |
| `npm run eval` | Runs the sample briefs in `evals/briefs/` through the real model chain (uses Groq quota) |
| `npm run compare` | Measures how consistently the three models price the same brief (uses Groq quota) |
| `npm run typecheck`, `npm run lint` | Type and lint checks |

## Project notes

`memory.md` records every decision, measurement and gotcha from the build; `docs/plan.md` is the original plan.
