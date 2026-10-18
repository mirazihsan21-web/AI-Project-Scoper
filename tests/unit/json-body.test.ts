import { describe, expect, it } from "vitest";
import { readJsonBody } from "@/lib/http/json-body";

const post = (body: string, headers: Record<string, string> = { "content-type": "application/json" }) =>
  new Request("https://scoper.example/api/x", { method: "POST", body, headers });

describe("readJsonBody", () => {
  it("parses a JSON body", async () => {
    expect(await readJsonBody(post('{"brief":"hi"}'), 1000)).toEqual({ ok: true, body: { brief: "hi" } });
  });

  it("accepts a charset on the content type", async () => {
    const result = await readJsonBody(post("{}", { "content-type": "application/json; charset=utf-8" }), 1000);
    expect(result.ok).toBe(true);
  });

  // A cross-site <form enctype="text/plain"> can send JSON-looking text without a CORS preflight; requiring
  // application/json means a browser must ask permission first, which our API never grants.
  it.each([["text/plain"], ["application/x-www-form-urlencoded"], [""]])("refuses content type %j with 415", async (type) => {
    const headers: Record<string, string> = type ? { "content-type": type } : {};
    expect(await readJsonBody(post('{"brief":"hi"}', headers), 1000)).toMatchObject({ ok: false, status: 415 });
  });

  it("refuses a body over the size limit with 413", async () => {
    expect(await readJsonBody(post(JSON.stringify({ brief: "a".repeat(2000) })), 1000)).toMatchObject({
      ok: false,
      status: 413,
    });
  });

  it("refuses malformed JSON with 400", async () => {
    expect(await readJsonBody(post("{not json"), 1000)).toMatchObject({ ok: false, status: 400 });
  });
});
