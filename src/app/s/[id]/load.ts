import { cacheLife } from "next/cache";
import { getDb } from "@/lib/db/client";
import { getScope } from "@/lib/db/scopes";

/**
 * Scopes never change after they are created, so a found one is cached for good.
 * A miss is cached only briefly, so made-up links cannot fill the cache.
 */
export async function loadScope(id: string) {
  "use cache";
  const scope = await getScope(getDb(), id);
  if (scope) cacheLife("max");
  else cacheLife("seconds");
  return scope;
}
