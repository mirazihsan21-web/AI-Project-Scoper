import Groq, { APIError } from "groq-sdk";
import { ModelCallError, type CallModel } from "./generate";
import { scopeJsonSchema } from "./schema";

const REQUEST_TIMEOUT_MS = 25_000;

export function toModelCallError(error: unknown): ModelCallError {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof APIError) {
    if (error.status === 429) {
      const seconds = Number.parseFloat(error.headers?.get("retry-after") ?? "");
      return new ModelCallError(message, "rate_limited", Number.isFinite(seconds) ? Math.round(seconds * 1000) : undefined);
    }
    if (error.status === 401 || error.status === 403) return new ModelCallError(message, "auth");
  }
  return new ModelCallError(message, "failed");
}

export function createGroqCaller(apiKey: string): CallModel {
  // SDK retries are off: on a 429 we switch to the next model at once instead of waiting.
  const client = new Groq({ apiKey, maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });

  return async (model, messages) => {
    try {
      const response = await client.chat.completions.create({
        model: model.id,
        messages,
        max_completion_tokens: model.maxTokens,
        reasoning_effort: model.reasoningEffort,
        response_format: {
          type: "json_schema",
          json_schema: { name: "project_scope", strict: true, schema: scopeJsonSchema },
        },
      });
      return {
        content: response.choices[0]?.message.content ?? "",
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      };
    } catch (error) {
      throw toModelCallError(error);
    }
  };
}
