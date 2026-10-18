export type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

/**
 * Reads a JSON request body defensively:
 * - only `application/json`, so a cross-site HTML form (which cannot set that type without a CORS preflight) is refused;
 * - stops reading once the body passes `maxBytes`, so a huge upload is never buffered whole.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") return { ok: false, status: 415, error: "Send the request as JSON." };

  const tooLarge = { ok: false, status: 413, error: "That request is too large." } as const;
  if (Number(request.headers.get("content-length")) > maxBytes) return tooLarge;

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return tooLarge;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, body: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400, error: "The request body isn't valid JSON." };
  }
}
