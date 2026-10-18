# Project Memory: AI Project Scoper ("Scoper")

> This is the source of truth for this project. Read it at the start of every session.
> Update it at the end of every build step: tick the checklist, add to the session log,
> and record any new decision or gotcha. Keep entries short.

## 1. Snapshot

- **What:** A visitor pastes a rough idea, a client email or call notes and gets a structured project scope:
  MoSCoW features, integrations, risks, milestones and a price/timeline range. They can download it
  as a PDF or "Book a call", which saves the lead and emails the owner.
- **Why:** Project #1 in `Agency_Portfolio_Projects.pdf`, a portfolio piece that shows reliable
  structured-output AI. It also works as a lead magnet.
- **Demo moment:** paste a messy WhatsApp-style brief and get a clean PDF spec in about 20 seconds.
- **Full plan:** `docs/plan.md`
- **Current phase:** Step 0 (setup) is done. Step 1 (schema and pricing engine) is next.

## 2. Decisions log

| Date | Decision | Why |
|------|----------|-----|
| 2026-10-19 | Build project #1 (AI Project Scoper) first | Easiest (1–2 wks) and best at winning work |
| 2026-10-19 | LLM provider is **Groq**, model `openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b` (both in env vars) | User's choice. These models support strict `json_schema` output |
| 2026-10-19 | **Standalone, neutral brand.** Working name "Scoper" (one constant, `src/lib/brand.ts`) | User: not connected to the agency's portfolio |
| 2026-10-19 | **Pricing is assumed for now.** All rates live in `src/lib/pricing/config.ts` | User: no historical project data yet |
| 2026-10-19 | The LLM returns **complexity sizes only**. Code turns them into hours and money | Numbers are deterministic and defensible, never made up by the LLM |
| 2026-10-19 | Two price tiers: **MVP** (must-haves) and **Full** (must + should + could) | Better sales conversation, and cheap to compute |
| 2026-10-19 | "Book a call" saves to **Supabase** and **emails the owner via Resend** with the PDF attached | User's choice |
| 2026-10-19 | Hosting: **Vercel** | User's choice. Native Next.js support |
| 2026-10-19 | Stack: Next.js 16 (App Router, Cache Components on), TS, Tailwind 4, Zod 4, groq-sdk, supabase-js, @react-pdf/renderer, Resend, Vitest, Playwright | From the PDF stack plus the decisions above |
| 2026-10-19 | `@types/node` bumped to ^24 (scaffold had ^20) | Vitest 5 peer requirement. Matches Node 24 runtime |

## 3. How we work

1. **Brainstorm** the feature (questions, then options, then a decision). Record decisions in section 2.
2. **Plan** in `docs/plan.md` before coding anything new.
3. **TDD** in small tasks: write a failing test, implement, make it pass.
4. **Verify** by running it: `npm test`, `npm run typecheck`, `npm run lint`, plus manual or e2e checks where relevant.
   Never call a step done without evidence.
5. **Update this file** (checklist, session log, gotchas), then **commit** with one commit per step.
6. If something is the user's call, **ask them** rather than guess.
7. Next.js 16 differs from older docs. Read `node_modules/next/dist/docs/` before writing Next.js code (see `AGENTS.md`).

## 4. Build checklist

- [x] **0. Setup:** git, memory.md, CLAUDE.md, docs/plan.md, Next.js scaffold, Vitest, Playwright, `.env.example`
- [ ] **1. Schema and pricing (TDD):** Zod scope schema plus a strict JSON-schema test, `estimate()` with table tests
- [ ] **2. LLM generation:** prompt, `generateScope()` with retry and fallback, fake LLM, 8 eval briefs, `npm run eval`
- [ ] **3. Database:** migration (`scopes`, `leads`, `rate_limits`, RLS on), server client, helpers
- [ ] **4. API and UI:** `/api/scope`, landing page, `/s/[id]` result page, loading and error states
- [ ] **5. PDF:** `ScopeDocument` and `/api/scope/[id]/pdf`
- [ ] **6. Leads:** form, `/api/leads`, Resend email with the PDF attached
- [ ] **7. Hardening:** rate limiting, input caps, honeypot, error states, mobile checks
- [ ] **8. Ship:** Vercel deploy, Lighthouse, README case study (architecture, p95 latency, cost per run)

## 5. Session log

### 2026-10-19, session 1
- Read the PDF. Picked project #1. Agreed the decisions in section 2 with the user. Wrote `docs/plan.md`.
- Step 0: scaffolded Next.js 16.4.2 and installed deps. Added Vitest config, `.env.example` and this file.
- **Next:** Step 1 (schema and pricing, no credentials needed).
- **Blockers / needed from the user:** Groq API key; Supabase project (URL and service-role key); Resend API key
  and notify email; Vercel account.

## 6. Assumptions and open questions

- **Pricing values are ASSUMED** (see `src/lib/pricing/config.ts`): USD $45/h blended rate, hour ranges per
  complexity size, 20% PM/QA overhead, 10/15/25% contingency, 60 team-hours/week, round to $500.
  Tune these once real project data exists.
- Final brand name: TBD by the user ("Scoper" is a working name).
- Email sender: `onboarding@resend.dev` until a domain is verified in Resend.

## 7. Gotchas

- **Groq structured outputs (`strict: true`) can't stream or use tools.** Show staged progress text instead.
- **Strict mode needs every property in `required`** (use `nullable` for optional fields) **and
  `additionalProperties: false` on every object.** A unit test enforces both.
- The `create-next-app` scaffold enables `cacheComponents`. Dynamic data reads must sit inside `<Suspense>` or be cached.
- `.remember/` is local plugin state and is git-ignored.
