import { getDb } from "@/lib/db/client";
import { checkRateLimit, hashIp } from "@/lib/db/rate-limit";
import { insertScope } from "@/lib/db/scopes";
import { clientIp } from "@/lib/http/client-ip";
import { handleScopeRequest } from "@/lib/scope/request";
import { getScopeGenerator } from "@/lib/scope/service";

// Up to three models can be tried in turn, each with a 25 s timeout.
export const maxDuration = 60;

const HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT is not set");

  const body = await request.json().catch(() => undefined);
  const db = getDb();
  const ipHash = hashIp(clientIp(request.headers), salt);
  const limit = Number(process.env.SCOPE_LIMIT_PER_HOUR ?? 5);

  const result = await handleScopeRequest(body, {
    checkLimit: () => checkRateLimit(db, ipHash, { limit, windowMs: HOUR_MS, now: Date.now() }),
    generate: getScopeGenerator(),
    save: (scope) => insertScope(db, scope),
  });

  return Response.json(result.body, {
    status: result.status,
    headers: result.retryAfterSeconds ? { "Retry-After": String(result.retryAfterSeconds) } : undefined,
  });
}
