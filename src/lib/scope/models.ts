export type ReasoningEffort = "none" | "low" | "medium" | "high";

export type ModelSpec = {
  id: string;
  /** max_completion_tokens; reasoning tokens count toward it. */
  maxTokens: number;
  reasoningEffort?: ReasoningEffort;
  /** USD list prices, used only to report cost per run. */
  inputPricePerM: number;
  outputPricePerM: number;
};

// Tried in this order. When one is rate limited or fails, the next one takes over.
const KNOWN_MODELS: ModelSpec[] = [
  { id: "openai/gpt-oss-120b", maxTokens: 4096, reasoningEffort: "low", inputPricePerM: 0.15, outputPricePerM: 0.6 },
  { id: "openai/gpt-oss-20b", maxTokens: 4096, reasoningEffort: "low", inputPricePerM: 0.075, outputPricePerM: 0.3 },
  // The free tier allows Qwen only 1000 output tokens per minute, and a request asking for more is rejected outright.
  // With thinking off, a concise scope just fits.
  { id: "qwen/qwen3.8-27b", maxTokens: 1000, reasoningEffort: "none", inputPricePerM: 0.8, outputPricePerM: 4 },
];

/** Builds the model chain from a comma-separated GROQ_MODELS value, or the default order when unset. */
export function resolveModels(list: string | undefined = process.env.GROQ_MODELS): ModelSpec[] {
  const ids = (list ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) return KNOWN_MODELS;
  return ids.map(
    (id) => KNOWN_MODELS.find((m) => m.id === id) ?? { id, maxTokens: 4096, inputPricePerM: 0, outputPricePerM: 0 },
  );
}
