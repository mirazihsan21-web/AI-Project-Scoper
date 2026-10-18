import type { ModelSpec } from "./models";
import { buildMessages, type ChatMessage } from "./prompt";
import { ScopeSchema, type Scope } from "./schema";

export type ModelCall = { content: string; inputTokens: number; outputTokens: number };
export type CallModel = (model: ModelSpec, messages: ChatMessage[]) => Promise<ModelCall>;

export type AttemptOutcome = "ok" | "rate_limited" | "cooling_down" | "invalid_output" | "failed";
export type Attempt = { model: string; outcome: AttemptOutcome };

export type GenerateResult = {
  scope: Scope;
  model: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  attempts: Attempt[];
};

/** Thrown by a CallModel implementation so the generator knows whether to switch model or stop. */
export class ModelCallError extends Error {
  constructor(
    message: string,
    readonly kind: "rate_limited" | "auth" | "failed",
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ModelCallError";
  }
}

/** Every model is rate limited right now. */
export class AllModelsBusyError extends Error {
  constructor(readonly retryAfterMs: number) {
    super(`All models are rate limited; retry in ${Math.ceil(retryAfterMs / 1000)}s`);
    this.name = "AllModelsBusyError";
  }
}

/** The brief was flagged as a prompt-injection attempt and never reached a model. */
export class BriefRejectedError extends Error {
  constructor() {
    super("The brief contains text that reads like instructions to the AI");
    this.name = "BriefRejectedError";
  }
}

/** No model produced a valid scope. */
export class ScopeGenerationError extends Error {
  constructor(readonly attempts: Attempt[]) {
    super(`No model produced a valid scope: ${attempts.map((a) => `${a.model}=${a.outcome}`).join(", ")}`);
    this.name = "ScopeGenerationError";
  }
}

const DEFAULT_COOLDOWN_MS = 60_000;

function parseScope(content: string): Scope | null {
  try {
    const parsed = ScopeSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Returns a function that turns a brief into a validated scope, walking the model chain in order.
 * A rate-limited model is skipped until its retry-after passes; that state lives in this closure,
 * so it is shared by every request the same server instance handles.
 */
export function createScopeGenerator({
  callModel,
  models,
  screen,
  now = Date.now,
}: {
  callModel: CallModel;
  models: ModelSpec[];
  /** Resolves true when the brief should be rejected as a prompt-injection attempt. */
  screen?: (brief: string) => Promise<boolean>;
  now?: () => number;
}) {
  const cooldownUntil = new Map<string, number>();

  return async function generateScope(brief: string): Promise<GenerateResult> {
    const started = now();
    if (screen && (await screen(brief))) throw new BriefRejectedError();

    const messages = buildMessages(brief);
    const attempts: Attempt[] = [];

    for (const model of models) {
      if ((cooldownUntil.get(model.id) ?? 0) > now()) {
        attempts.push({ model: model.id, outcome: "cooling_down" });
        continue;
      }

      let call: ModelCall;
      try {
        call = await callModel(model, messages);
      } catch (error) {
        if (error instanceof ModelCallError && error.kind === "auth") throw error;
        if (error instanceof ModelCallError && error.kind === "rate_limited") {
          cooldownUntil.set(model.id, now() + (error.retryAfterMs ?? DEFAULT_COOLDOWN_MS));
          attempts.push({ model: model.id, outcome: "rate_limited" });
        } else {
          attempts.push({ model: model.id, outcome: "failed" });
        }
        continue;
      }

      const scope = parseScope(call.content);
      if (!scope) {
        attempts.push({ model: model.id, outcome: "invalid_output" });
        continue;
      }

      attempts.push({ model: model.id, outcome: "ok" });
      return {
        scope,
        model: model.id,
        latencyMs: now() - started,
        inputTokens: call.inputTokens,
        outputTokens: call.outputTokens,
        attempts,
      };
    }

    if (attempts.every((a) => a.outcome === "rate_limited" || a.outcome === "cooling_down")) {
      const soonest = Math.min(...models.map((m) => cooldownUntil.get(m.id) ?? 0));
      throw new AllModelsBusyError(Math.max(0, soonest - now()));
    }
    throw new ScopeGenerationError(attempts);
  };
}

export type ScopeGenerator = ReturnType<typeof createScopeGenerator>;
