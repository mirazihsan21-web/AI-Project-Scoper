# CLAUDE.md

@AGENTS.md

## Start here

1. Read `memory.md`. It holds this project's decisions, workflow, build checklist and session log.
2. Read `docs/plan.md` for the full approved plan.
3. At the end of each build step: run `npm test`, `npm run typecheck` and `npm run lint`, then update `memory.md`
   (checklist, session log, decisions, gotchas), then commit.

## Rules

- The LLM never outputs prices or hours. It returns complexity sizes, and `src/lib/pricing/estimate.ts` turns those into money.
- Pricing constants live only in `src/lib/pricing/config.ts` and are marked as assumptions.
- The Groq schema must stay strict-mode compatible. `tests/unit/scope-schema.test.ts` enforces this.
- Secrets live only in `.env.local`, never committed. The Supabase service-role key is used on the server only.
