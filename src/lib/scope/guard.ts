import Groq from "groq-sdk";

/** Returns the probability (0-1) that a text is a prompt injection or jailbreak attempt. */
export type ScoreText = (text: string) => Promise<number>;

const GUARD_MODEL = "meta-llama/llama-prompt-guard-2-86m";

/**
 * Prompt Guard reads at most 512 tokens, so long briefs are scored in overlapping chunks.
 * The overlap means an injection split across a chunk boundary still appears whole in one chunk.
 */
export function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  for (let start = 0; ; start += size - overlap) {
    chunks.push(text.slice(start, start + size));
    if (start + size >= text.length) return chunks;
  }
}

/**
 * Flags a brief whose highest chunk score reaches the threshold.
 * Fails open (`score: null`): if the classifier is down, we still scope the brief instead of losing the lead.
 */
export async function screenBrief(
  brief: string,
  score: ScoreText,
  { threshold = 0.5, chunkSize = 1500, overlap = 200 } = {},
): Promise<{ flagged: boolean; score: number | null }> {
  try {
    const scores = await Promise.all(chunkText(brief, chunkSize, overlap).map(score));
    const max = Math.max(...scores);
    return { flagged: max >= threshold, score: max };
  } catch (error) {
    console.warn("Prompt Guard unavailable, scoping without screening:", error);
    return { flagged: false, score: null };
  }
}

export function createGroqGuard(apiKey: string): ScoreText {
  const client = new Groq({ apiKey, maxRetries: 1, timeout: 5_000 });
  return async (text) => {
    const response = await client.chat.completions.create({
      model: GUARD_MODEL,
      messages: [{ role: "user", content: text }],
    });
    const value = Number.parseFloat(response.choices[0]?.message.content ?? "");
    if (!Number.isFinite(value)) throw new Error(`Unexpected Prompt Guard output: ${response.choices[0]?.message.content}`);
    return value;
  };
}
