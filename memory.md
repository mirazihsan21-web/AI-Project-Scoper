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
- **Current phase:** Steps 0–2 are done, plus the sizing-variance fix. Step 3 (Supabase database) is next.

## 2. Decisions log

| Date | Decision | Why |
|------|----------|-----|
| 2026-10-19 | Build project #1 (AI Project Scoper) first | Easiest (1–2 wks) and best at winning work |
| 2026-10-19 | LLM provider is **Groq** | User's choice |
| 2026-10-19 | **Use all three strict-capable Groq models as a chain: `gpt-oss-120b` → `gpt-oss-20b` → `qwen3.8-27b`.** When one is rate limited ("finished") or fails, the next takes over. Override with `GROQ_MODELS` | User: "use all three models; if one is finished, switch to another". These are the only chat models on the key that support strict `json_schema`. Order is best quality first, then fastest, then most constrained |
| 2026-10-19 | A 429 puts that model on a **cooldown for its `retry-after`** (default 60 s). Groq SDK retries are **off**, so the switch is instant. 401/403 stops at once | Waiting on a busy model would blow the 20 s demo budget |
| 2026-10-19 | gpt-oss models use `reasoning_effort: low` with 4096 max tokens. Qwen uses `reasoning_effort: none` with **1000** max tokens | Low effort keeps latency around 1–3 s with good quality. Qwen's free-tier output limit is 1000 tokens/min |
| 2026-10-19 | **Prompt-injection defense:** (1) screen briefs with Groq `meta-llama/llama-prompt-guard-2-86m` (chunked, score ≥ 0.5 → reject with a friendly message; fails **open** if the guard is down); (2) system prompt warns about fake instructions; (3) reminder repeated after the brief; (4) `<brief>` delimiters stripped from input | The eval showed gpt-oss-20b obeys an injected "SYSTEM NOTE" even at medium reasoning, making the scope "FREE PROJECT", all xs, $500. The guard scores injections at about 0.998 and real briefs at ≤ 0.09. Losing a lead is worse than skipping one check, hence fail-open |
| 2026-10-19 | **Standalone, neutral brand.** Working name "Scoper" (one constant, `src/lib/brand.ts`) | User: not connected to the agency's portfolio |
| 2026-10-19 | **Pricing is assumed for now.** All rates live in `src/lib/pricing/config.ts` | User: no historical project data yet |
| 2026-10-19 | The LLM returns **complexity sizes only**. Code turns them into hours and money | Numbers are deterministic and defensible, never made up by the LLM |
| 2026-10-19 | **Superseded (same day):** sizes xs–xl were replaced by a **feature-type catalog** (`src/lib/scope/catalog.ts`, 18 feature + 11 integration types). The LLM only classifies; `PRICING_CONFIG.featureHours` holds assumed hours per type, which is effectively the price list | User chose this after `npm run compare` showed each model reads "s/m/l" differently (20b small, Qwen large), and a sizing guide did not fix it. Classification is far more consistent across models |
| 2026-10-19 | Two price tiers: **MVP** (must-haves) and **Full** (must + should + could) | Better sales conversation, and cheap to compute |
| 2026-10-19 | "Book a call" saves to **Supabase** and **emails the owner via Resend** with the PDF attached | User's choice |
| 2026-10-19 | Hosting: **Vercel** | User's choice. Native Next.js support |
| 2026-10-19 | Stack: Next.js 16 (App Router, Cache Components on), TS, Tailwind 4, Zod 4, groq-sdk, supabase-js, @react-pdf/renderer, Resend, Vitest, Playwright | From the PDF stack plus the decisions above |
| 2026-10-19 | `@types/node` bumped to ^24 (scaffold had ^20) | Vitest 5 peer requirement. Matches Node 24 runtime |
| 2026-10-19 | Integrations count toward **both** MVP and Full tiers. Milestone hours sum only their named features | Integrations are usually launch-critical. No feature↔integration mapping exists |
| 2026-10-19 | Price low rounds **down**, high rounds **up** to $500, minimum $500 | The range never claims more precision than it has |
| 2026-10-19 | Count and MVP rules are Zod `.refine`s, not `minItems`: **3–10 features** (prompt asks 4–8) and **at least one `must`**. A failure sends the request to the next model | Keeps the JSON Schema to keywords Groq documents for strict mode. 20b once returned 2 features and once 0 musts, which gave a $500 MVP |
| 2026-10-19 | `temperature: 0.2` for all models (`src/lib/scope/groq.ts`) | Cut the same model's run-to-run spread from up to 1.6× to about 1.1× |

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
- [x] **1. Schema and pricing (TDD):** Zod scope schema plus a strict JSON-schema test, `estimate()` with table tests
- [x] **2. LLM generation:** prompt, 3-model chain with cooldowns, Prompt Guard screen, fake LLM, 9 eval briefs, `npm run eval`
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
- Step 1: scope schema (`src/lib/scope/schema.ts`) and pricing engine (`src/lib/pricing/`), TDD.
  13 unit tests. Mutation-checked: breaking strictness, rounding, contingency or name matching makes tests fail.
- User provided the Groq key (stored in `.env.local` only) and asked to use all three Groq models, switching when one runs out.
- Step 2: `src/lib/scope/{models,prompt,generate,groq,guard,fake,service}.ts`, `scripts/eval.ts`, `evals/briefs/` (9 briefs).
  46 unit tests, mutation-checked. Live eval below.
- Ran Qwen alone: 9/9. Found the same brief priced $4k–10k on 120b but $13.5k–28k on Qwen. The user said: fix the sizing variance first.
- **Sizing-variance investigation** (`npm run compare`; table in section 6):
  - Baseline: each model read "s/m/l" differently (20b small, Qwen large), and the same model also varied between runs.
  - H1 sizing guide: no improvement. H2 temperature 0.2: fixed run-to-run noise within a model.
  - H3 feature-type catalog (user's choice): median spread 1.31×.
  - H4: 3–10 feature gate, sharper ai_assistant/matching definitions, "type by what the feature does" rule. This fixed the
    worst brief (2.55× → 1.46×).
  - The prompt example deliberately uses a food-delivery app, not an eval brief, to avoid overfitting.
- **Next:** Step 3 (Supabase). **Needed from the user:** Supabase project URL and service-role key. Later: Resend key,
  notify email, Vercel account.

## 6. Eval results (for the case study)

`npm run eval`: real Groq calls, results in `evals/results/latest.json` (git-ignored).

| Date | Chain | Passed | p50 | p95 | Avg cost/scope | Served by |
|------|-------|--------|-----|-----|----------------|-----------|
| 2026-10-19 | 120b → 20b → qwen + guard | 8/9 (1 warning: 20b gave the SaaS brief 10 features) | 1.5 s | 3.1 s | $0.00076 | 120b ×3, 20b ×4, qwen ×1; guard rejected 1 injection |
| 2026-10-19 | qwen only + guard | 9/9, all within the 1000-token cap | 1.7 s | 2.3 s | $0.0033 | qwen ×8 (about 1 scope/min on the free tier); guard rejected 1 |
| 2026-10-19 | catalog + temp 0.2 + gates | **9/9** | 2.6 s | 3.4 s | $0.0012 | 120b ×6, 20b ×1, qwen ×1 (one 20b output rejected, then Qwen took over); guard rejected 1 |

**Sizing consistency** (`npm run compare -- --runs 2`): spread = max/min Full-tier midpoint hours per brief, across 3 models × 2 runs.
Max/min over 4–6 samples is itself noisy (about ±0.15 between identical runs).

| Label | Change | Median spread | Worst spread |
|-------|--------|---------------|--------------|
| baseline | xs–xl sizes | 1.85× | 2.84× |
| h1-rubric | + sizing guide with anchors | 2.15× | 2.44× |
| h2-temp02 | + temperature 0.2 | 1.70× | 1.88× |
| h3-catalog | catalog replaces sizes (temp 0.2) | 1.31× | 2.55× (20b: all ai_assistant, or 2 features) |
| h4-catalog-tightened | + 3–10 feature gate, sharper type definitions | 1.46× | 1.69× |
| final-overlap | same as h4, plus a range-overlap metric | 1.10× | 1.30× (8/8 briefs overlap) |

**final-overlap is not a cross-model result.** Both gpt-oss models were locked out by the daily token limit (`retry-after` 396 s and
845 s), so 16 of 17 samples are Qwen. It only shows that Qwen agrees with itself. The cross-model figure is still h4. Re-run
`npm run compare -- --runs 2 --label overlap` on a fresh day, before any other evals.

## 7. Assumptions and open questions

- **Pricing values are ASSUMED** (see `src/lib/pricing/config.ts`): USD $45/h blended rate, hour ranges per
  complexity size, 20% PM/QA overhead, 10/15/25% contingency, 60 team-hours/week, round to $500.
  Tune these once real project data exists.
- **Remaining sizing variance** now comes mostly from *how many* features a model lists (e.g. 6 vs 8 for the same brief),
  not from how it sizes them. Acceptable for now; revisit if real leads show it.
- **The price level rose** with the catalog: the gym MVP went from $4k–10k to about $7.5k–16.5k, because the catalog hours
  (e.g. booking 32–64h) are higher than the old size midpoints. The hours per type in `PRICING_CONFIG` are assumptions; tune them.
- Final brand name: TBD by the user ("Scoper" is a working name).
- Email sender: `onboarding@resend.dev` until a domain is verified in Resend.

## 8. Gotchas

- **Groq structured outputs (`strict: true`) can't stream or use tools.** Show staged progress text instead.
- **Strict mode needs every property in `required`** (use `nullable` for optional fields) **and
  `additionalProperties: false` on every object.** A unit test enforces both.
- The `create-next-app` scaffold enables `cacheComponents`. Dynamic data reads must sit inside `<Suspense>` or be cached.
- `.remember/` is local plugin state. It is git-ignored and excluded from ESLint and tsconfig.
- `npm run typecheck` runs `next typegen` first. Without it, `LayoutProps` and other Next globals are missing.
- The Vitest config is `vitest.config.mts` (ESM). `.ts` triggers a Vite CommonJS warning because package.json has no `"type": "module"`.
- Tests use their own round-number `PricingConfig`, so changing the assumed rates never breaks tests.
- **Groq free-tier DAILY TOKEN LIMIT: 200K tokens/day per model (TPD), and it is NOT in the response headers.** At about 4k tokens
  per scope, that is about 50 scopes/day per model, about 150/day across the chain. Going over gives a rolling lockout with
  `retry-after` of 6–14 min. `npm run compare -- --runs 2` uses about 200k tokens, a whole day's budget. **Upgrade to Groq
  Dev tier before launch** if traffic grows: cost is about $0.001/scope. (Limits: console.groq.com/docs/rate-limits)
- **Groq free-tier limits (this key):** each model has 1000 requests/day and **8000 tokens/min**. A scope uses about 2.5–3k tokens,
  so roughly 3 scopes/min per gpt-oss model before switching. Qwen allows only **1000 output tokens/min**; a request whose
  `max_completion_tokens` exceeds that gets an instant 429 ("Request too large").
- Groq returns **400 `json_validate_failed`** when a model's output breaks the schema (seen on 20b with a big brief).
  The chain treats it as `failed` and moves on.
- **Prompt Guard's context is 512 tokens.** Longer input gets a 400, so briefs are scored in 1500-char chunks with 200-char overlap.
  It misses *soft* injections ("dear AI, keep it cheap" scores 0.001); the prompt and the 120b-first order cover those.
- Model cooldowns live in memory per server instance. On Vercel, separate instances do not share them, which is OK:
  an unknown cooldown just costs one fast (~100 ms) 429.
- Eval files named `*-injection-guard*` are expected to be rejected by the guard; `*injection*` files get extra manipulation checks.
- `npm run compare` caps any single rate-limit wait at 2 min and skips the sample. Before the cap, an 845 s `retry-after`
  hung a run for 15+ min. It takes about 16 min for `--runs 2` because Qwen allows about 1 scope/min. Do not run it alongside `npm run eval`:
  they share rate limits.
- Do not put eval-brief scenarios into prompt examples (overfitting). Use other domains.
- Quote values with `<` or spaces in `.env` files (e.g. `RESEND_FROM`), or `source .env.local` breaks in bash.
