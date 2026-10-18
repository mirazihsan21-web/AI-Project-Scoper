import { fakeCaller } from "./fake";
import { createScopeGenerator, type ScopeGenerator } from "./generate";
import { createGroqCaller } from "./groq";
import { createGroqGuard, screenBrief } from "./guard";
import { resolveModels } from "./models";

let generator: ScopeGenerator | undefined;

/** One generator per server instance, so model cooldowns carry across requests. */
export function getScopeGenerator(): ScopeGenerator {
  if (!generator) {
    const fake = process.env.SCOPER_FAKE_LLM === "1";
    const apiKey = process.env.GROQ_API_KEY;
    if (!fake && !apiKey) throw new Error("GROQ_API_KEY is not set (or set SCOPER_FAKE_LLM=1)");
    const guard = fake ? undefined : createGroqGuard(apiKey!);
    generator = createScopeGenerator({
      callModel: fake ? fakeCaller : createGroqCaller(apiKey!),
      models: resolveModels(),
      screen: guard && (async (brief) => (await screenBrief(brief, guard)).flagged),
    });
  }
  return generator;
}
