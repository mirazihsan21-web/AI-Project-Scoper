# CLAUDE.md

@AGENTS.md

## Start here

1. Read `memory.md`. It holds this project's decisions, workflow, build checklist and session log.
2. Read `docs/plan.md` for the full approved plan.
3. At the end of each build step: run `npm test`, `npm run typecheck` and `npm run lint`, then update `memory.md`
   (checklist, session log, decisions, gotchas), then commit.

## Rules

- The LLM never outputs prices or hours. It classifies features and integrations into catalog types, and `src/lib/pricing/estimate.ts` turns those into money.
- Pricing constants (hours per catalog type, rate, overhead) live only in `src/lib/pricing/config.ts` and are marked as assumptions.
- Feature and integration types live only in `src/lib/scope/catalog.ts`. The schema enum and the prompt are generated from it.
  After changing it, run `npm run compare` and record the spread in `memory.md`.
- The Groq schema must stay strict-mode compatible. `tests/unit/scope-schema.test.ts` enforces this.
- The Groq model chain (order, token budgets, prices) lives only in `src/lib/scope/models.ts`. After changing the prompt
  or the models, run `npm run eval` and record the result in `memory.md` section 6.
- Secrets live only in `.env.local`, never committed. The Supabase secret key is used on the server only, through
  `getDb()` in `src/lib/db/client.ts`. Never send it to the browser and never prefix it with `NEXT_PUBLIC_`.
- Database changes: create the file with `npx supabase migration new <name>` and grant `service_role` explicitly. Then run
  `db push --linked --dry-run`, then `db push --linked`, regenerate `src/lib/db/types.ts`, run advisors, and run `npm run test:integration`.
