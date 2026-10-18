# Plan: AI Project Scoper (Project #1 from Agency_Portfolio_Projects.pdf)

## Context

`Agency_Portfolio_Projects.pdf` lists 10 showcase builds. Project #1, the **AI Project Scoper**, is ranked easiest (1–2 weeks) and best at winning work. A visitor pastes a rough idea, a client email or call notes. They get back a structured scope: must/should/could features, integrations, risks, milestones and a price range. They can download it as a PDF and click "Book a call", which sends the lead plus the scope to the owner. The demo moment: paste a messy, WhatsApp-style brief and get a clean PDF spec in about 20 seconds.

The repo `E:\CODING\aiprojectscoper` is empty apart from the PDF, so this is a new project.

**Decisions from the user (2026-10-19):**
- LLM: **Groq**.
- Pricing is an **assumption** for now. Rates live in a config file and are not based on the agency's past projects.
- **Standalone, neutral brand.** The app does not use the agency's name or data. Working name "Scoper", set in one constant.
- "Book a call" **saves the lead to Supabase and emails the owner** through Resend, with the PDF attached.
- Price comes from **LLM complexity estimates multiplied by assumed rates in code**. The LLM never writes the price itself.
- Hosting: **Vercel**.
- The user wants a **`memory.md`** in the project that records how we plan and each step we take, so any later session can pick up where we left off.

## Approach

### Stack
- Next.js (latest, App Router) + TypeScript + Tailwind, using npm.
- `groq-sdk` calling `openai/gpt-oss-120b`, with `response_format: json_schema` and `strict: true`. Fallback model is `openai/gpt-oss-20b`. Both come from env vars.
  - Groq limits to plan around: structured outputs **can't stream**. In strict mode, **every property must be in `required`** (optional fields become `["type","null"]`), and **every object needs `additionalProperties: false`**.
- Zod v4 is the single source of the schema. `z.toJSONSchema()` produces the JSON Schema sent to Groq. The response is checked against the Zod schema again after parsing.
- Supabase Postgres on a hosted free project, with migrations in `supabase/migrations/`. Writes happen only on the server, with the service-role key. RLS is on and there are no anon policies.
- `@react-pdf/renderer` builds the PDF on the server, using the Node runtime.
- Resend sends the lead notification to `LEAD_NOTIFY_EMAIL` (from an env var; not hard-coded).
- Tests: Vitest for units, Playwright for e2e. The e2e run uses a fake LLM, turned on with `SCOPER_FAKE_LLM=1`.

### What the LLM returns (`src/lib/scope/schema.ts`)
`projectTitle`, `summary`, `projectType` (enum), `assumptions[]`, `openQuestions[]`, `features[] {name, description, priority: must|should|could, complexity: xs|s|m|l|xl}`, `integrations[] {name, purpose, complexity: s|m|l}`, `risks[] {title, detail, severity: low|medium|high, mitigation}`, `milestones[] {name, goal, featureNames[]}`.
The LLM returns **no hours and no money**.

### Pricing engine (`src/lib/pricing/`), a pure function that is easy to test
- `config.ts`: all values here are **ASSUMED** and clearly marked. Currency is USD with one blended hourly rate. Feature complexity maps to an hour range: xs 4–8, s 8–16, m 16–40, l 40–80, xl 80–160. Integrations: s 6–12, m 12–24, l 24–48. PM/QA overhead adds 20%. Contingency is 10%, 15% or 25%, depending on the highest risk severity. Team capacity is 60 h/week. Prices round to $500.
- `estimate.ts`: `estimate(scope, config)` returns `{ mvp: {hoursLow, hoursHigh, priceLow, priceHigh, weeksLow, weeksHigh}, full: {...}, milestoneHours[] }`. "MVP" counts only the must-have features; "full" counts must, should and could.

### Request flow
1. `/` is the landing page. It has a textarea capped at 10k characters and three "try a sample" briefs (a messy WhatsApp chat, a client email, call notes). The loading state shows staged progress text.
2. `POST /api/scope` runs these steps:
   1. Validate the input.
   2. Rate-limit to 5 scopes per IP per hour, using a Supabase `rate_limits` table.
   3. Call `generateScope()`, which has one retry and then the fallback model.
   4. Validate the result with Zod and run `estimate()`.
   5. Insert into `scopes` (input, output JSON, pricing, model, latency, tokens).
   6. Return `{ id }`.
3. `/s/[id]` shows the result. The id is a UUID, so the page is shareable but hard to guess. It has sections for summary, features grouped by MoSCoW, integrations, risks, milestones, and the MVP and full price and timeline, with an "estimate based on assumptions" disclaimer. It also has a Download PDF button and the "Book a call" form (name, email, company, notes, plus a honeypot field).
4. `GET /api/scope/[id]/pdf` streams the PDF.
5. `POST /api/leads` inserts into `leads` (linked by `scope_id`). It then emails the owner through Resend with a lead summary, a link to the scope, and the PDF attached.

### File layout
```
memory.md                     # project memory: decisions, workflow, step log (see below)
CLAUDE.md                     # "read memory.md first; update it after every step"
.env.example                  # GROQ_API_KEY, GROQ_MODEL, GROQ_FALLBACK_MODEL, SUPABASE_URL,
                              # SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, LEAD_NOTIFY_EMAIL, APP_URL
docs/plan.md                  # copy of this plan
src/app/page.tsx, src/app/s/[id]/page.tsx
src/app/api/scope/route.ts, src/app/api/scope/[id]/pdf/route.ts, src/app/api/leads/route.ts
src/lib/scope/{schema,prompt,generate,fake}.ts
src/lib/pricing/{config,estimate}.ts
src/lib/db/{client,scopes,leads,rate-limit}.ts
src/lib/email/send-lead.ts
src/lib/pdf/ScopeDocument.tsx
src/components/…              # BriefForm, ScopeView, PriceCard, LeadForm
supabase/migrations/0001_init.sql   # scopes, leads, rate_limits + RLS on
evals/briefs/*.txt, scripts/eval.ts
tests/unit/…, tests/e2e/…
```

### `memory.md` (created in the first step, then updated at the end of every step)
1. **Snapshot:** what we're building, why, the source PDF, and the current phase.
2. **Decisions log:** date, decision, reason. It starts with the decisions above, plus Groq model and strict-mode notes.
3. **How we work:** brainstorm, then plan, then TDD in small tasks. Check each step by running it, then update memory.md and commit. Questions go to the user, never guesses.
4. **Build checklist:** the phases below, as checkboxes.
5. **Session log:** one entry per session: date, what was done, what's next, any blockers.
6. **Assumptions and open questions:** the pricing values to tune later, the final brand name, and the sender domain.
7. **Gotchas:** for example, Groq strict mode means no streaming and every field required.

I'll also save a short pointer in Claude's auto-memory (`~/.claude/projects/E--CODING-aiprojectscoper/memory/`) saying that `memory.md` is the project's source of truth.

## Build steps (each step ends with: tests pass, then update memory.md, then commit)

0. **Setup.** `git init`, write `memory.md`, `CLAUDE.md` and `docs/plan.md`, scaffold Next.js, add Vitest and Playwright, add `.env.example`.
1. **Schema and pricing (TDD).** Write the Zod schema. Add a unit test that walks the generated JSON Schema and checks that every object has `additionalProperties:false` and every property is required. Build `estimate()` with table-driven tests.
2. **LLM generation.** Write the prompt (the brief goes in delimiters and is treated as data), `generateScope()` with retry and fallback, and the fake LLM. Add 8 sample briefs and `npm run eval`. The eval checks schema validity and records p50/p95 latency and token cost per run.
3. **Database.** Write the migration, the server client, and the `scopes`/`leads`/`rate_limits` helpers. Apply the migration to the hosted project.
4. **API and UI.** Build `/api/scope`, the landing page, the result page, and the loading and error states.
5. **PDF.** Build `ScopeDocument` and the download route.
6. **Leads.** Build the form, `/api/leads`, and the Resend email with the PDF attached.
7. **Hardening.** Add rate limiting, input caps, the honeypot, friendly error states, and mobile layout checks.
8. **Ship.** Deploy to Vercel with env vars set, run Lighthouse, and write a README case study (problem, architecture diagram, p95 latency, cost per run, demo video checklist).

**Needed from the user:** a Groq API key, a Supabase project (URL and service-role key), a Resend API key (plus a verified domain, or `onboarding@resend.dev` for testing), the notify email address, and a Vercel account.

## Verification
- `npm test`: schema strictness, the pricing engine (MVP vs full, rounding, contingency tiers) and input validation.
- `npm run eval`: real Groq calls on 8 briefs. Target: 100% schema-valid and p95 under 20 s. Prints the cost per run.
- `npm run e2e` with `SCOPER_FAKE_LLM=1`: paste a brief, land on `/s/[id]`, download the PDF (200, `application/pdf`), and submit a lead. Then check that the row exists in Supabase and that the email send was called (mocked in e2e).
- Manual check: `npm run dev`, paste the WhatsApp sample, time it end to end, open the PDF, book a call, and confirm the email arrives with the PDF attached.
- On the Vercel preview: Lighthouse at 90+ for performance and accessibility, and a re-run of the manual check.
