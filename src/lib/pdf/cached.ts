import { cacheLife } from "next/cache";
import { loadScope } from "@/lib/db/load-scope";
import { renderScopePdf } from "./render";

/**
 * The scope's PDF, rendered once and then served from cache: scopes never change, and rendering costs
 * about a third of a second of CPU, so repeated downloads of one link should not repeat that work.
 */
export async function scopePdf(id: string, appUrl: string): Promise<Uint8Array<ArrayBuffer> | null> {
  "use cache";
  const stored = await loadScope(id);
  if (!stored) {
    cacheLife("seconds");
    return null;
  }
  cacheLife("max");
  return renderScopePdf(stored, appUrl);
}
