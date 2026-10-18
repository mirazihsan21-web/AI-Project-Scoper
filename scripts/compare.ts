/**
 * Measures how consistently the models size the same brief. Every brief runs on every model, `--runs` times each,
 * with the models in parallel because each has its own rate limits. Reports the per-brief spread of
 * Full-tier hours and what drives it.
 *
 *   npm run compare -- --runs 2 --label baseline
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { estimate } from "@/lib/pricing/estimate";
import { AllModelsBusyError, createScopeGenerator } from "@/lib/scope/generate";
import { createGroqCaller } from "@/lib/scope/groq";
import { resolveModels } from "@/lib/scope/models";
import type { Scope } from "@/lib/scope/schema";

const BRIEFS_DIR = path.join(process.cwd(), "evals", "briefs");
const RESULTS_DIR = path.join(process.cwd(), "evals", "results");

type Sample = {
  brief: string;
  model: string;
  features: number;
  musts: number;
  types: string;
  integrations: number;
  maxSeverity: string;
  mvpMid: number;
  fullMid: number;
  fullLow: number;
  fullHigh: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mid = (low: number, high: number) => Math.round((low + high) / 2);

function sample(brief: string, model: string, scope: Scope): Sample {
  const { mvp, full, assumptions } = estimate(scope, PRICING_CONFIG);
  return {
    brief,
    model: model.split("/")[1],
    features: scope.features.length,
    musts: scope.features.filter((f) => f.priority === "must").length,
    // First 4 letters of each feature type, sorted, so runs are easy to compare by eye.
    types: scope.features.map((f) => f.type.slice(0, 4)).sort().join(","),
    integrations: scope.integrations.length,
    maxSeverity: `${Math.round(assumptions.contingencyPct * 100)}%`,
    mvpMid: mid(mvp.hoursLow, mvp.hoursHigh),
    fullMid: mid(full.hoursLow, full.hoursHigh),
    fullLow: full.hoursLow,
    fullHigh: full.hoursHigh,
  };
}

async function main() {
  const { values } = parseArgs({ options: { runs: { type: "string", default: "1" }, label: { type: "string", default: "run" } } });
  const runs = Number(values.runs);
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing; put it in .env.local");

  // Guard-rejected briefs never reach sizing, so skip them.
  const files = (await readdir(BRIEFS_DIR)).filter((f) => f.endsWith(".txt") && !f.includes("injection-guard")).sort();
  const briefs = await Promise.all(files.map(async (f) => [f, await readFile(path.join(BRIEFS_DIR, f), "utf8")] as const));
  const callModel = createGroqCaller(apiKey);
  const samples: Sample[] = [];

  await Promise.all(
    resolveModels().map(async (spec) => {
      const generate = createScopeGenerator({ callModel, models: [spec] });
      for (let run = 0; run < runs; run++) {
        for (const [file, brief] of briefs) {
          for (let tries = 0; tries < 8; tries++) {
            try {
              const result = await generate(brief);
              samples.push(sample(file, spec.id, result.scope));
              process.stdout.write(".");
              break;
            } catch (error) {
              if (error instanceof AllModelsBusyError) {
                await sleep(error.retryAfterMs + 500);
                continue;
              }
              process.stdout.write("x");
              console.error(`\n${spec.id} ${file}: ${error instanceof Error ? error.message : error}`);
              break;
            }
          }
        }
      }
    }),
  );

  console.log("\n");
  const spreads: number[] = [];
  let overlapping = 0;
  for (const file of files) {
    const rows = samples.filter((s) => s.brief === file).sort((a, b) => a.model.localeCompare(b.model));
    if (rows.length === 0) continue;
    const fulls = rows.map((r) => r.fullMid);
    const spread = Math.max(...fulls) / Math.min(...fulls);
    spreads.push(spread);
    // What a visitor notices: do two quotes for the same brief share any common ground?
    const overlap = Math.min(...rows.map((r) => r.fullHigh)) >= Math.max(...rows.map((r) => r.fullLow));
    if (overlap) overlapping++;
    console.log(`${file}  Full-hours spread ${spread.toFixed(2)}x  ranges ${overlap ? "all overlap" : "DO NOT all overlap"}`);
    for (const r of rows) {
      console.log(
        `  ${r.model.padEnd(14)} feat ${String(r.features).padStart(2)} must ${r.musts}  ${r.types.padEnd(40)} ` +
          `integ ${r.integrations}  cont ${r.maxSeverity.padStart(3)}  MVP ${String(r.mvpMid).padStart(4)}h  Full ${String(r.fullMid).padStart(4)}h`,
      );
    }
  }
  const sorted = [...spreads].sort((a, b) => a - b);
  const summary = {
    label: values.label,
    runs,
    medianSpread: Number(sorted[Math.floor(sorted.length / 2)].toFixed(2)),
    worstSpread: Number(sorted.at(-1)!.toFixed(2)),
    briefsWhereAllRangesOverlap: `${overlapping}/${spreads.length}`,
  };
  console.log("\nSummary", summary);
  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(path.join(RESULTS_DIR, `compare-${values.label}.json`), JSON.stringify({ summary, samples }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
