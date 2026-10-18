import { describe, expect, it } from "vitest";
import { ScopeSchema, scopeJsonSchema } from "@/lib/scope/schema";
import { sampleScope } from "../fixtures/scope";

type JsonNode = Record<string, unknown>;

// Keywords Groq documents for strict structured outputs. Anything else risks a 400 at request time.
const ALLOWED_KEYWORDS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "description",
  "anyOf",
  "$defs",
  "$ref",
  "title",
  "const",
]);

function walk(node: unknown, visit: (n: JsonNode, path: string) => void, path = "#") {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, visit, `${path}/${i}`));
    return;
  }
  if (node && typeof node === "object") {
    const n = node as JsonNode;
    visit(n, path);
    for (const [key, child] of Object.entries(n)) {
      // `properties` and `$defs` map names to schemas; the names themselves are not keywords.
      if (key === "properties" || key === "$defs") {
        for (const [name, sub] of Object.entries(child as JsonNode)) {
          walk(sub, visit, `${path}/${key}/${name}`);
        }
      } else if (key !== "enum" && key !== "required" && key !== "const") {
        walk(child, visit, `${path}/${key}`);
      }
    }
  }
}

describe("scopeJsonSchema (sent to Groq in strict mode)", () => {
  it("closes every object and marks every property required", () => {
    const problems: string[] = [];
    walk(scopeJsonSchema, (n, path) => {
      if (n.type !== "object") return;
      if (n.additionalProperties !== false) problems.push(`${path}: additionalProperties is not false`);
      const keys = Object.keys((n.properties as JsonNode) ?? {}).sort();
      const required = [...((n.required as string[]) ?? [])].sort();
      if (JSON.stringify(keys) !== JSON.stringify(required)) {
        problems.push(`${path}: required ${JSON.stringify(required)} != properties ${JSON.stringify(keys)}`);
      }
    });
    expect(problems).toEqual([]);
  });

  it("uses only keywords Groq strict mode supports", () => {
    const unsupported: string[] = [];
    walk(scopeJsonSchema, (n, path) => {
      for (const key of Object.keys(n)) {
        if (!ALLOWED_KEYWORDS.has(key)) unsupported.push(`${path}: ${key}`);
      }
    });
    expect(unsupported).toEqual([]);
  });
});

describe("ScopeSchema", () => {
  it("accepts a well-formed scope", () => {
    expect(ScopeSchema.safeParse(sampleScope).success).toBe(true);
  });

  it("rejects a priority outside must/should/could", () => {
    const bad = {
      ...sampleScope,
      features: [{ ...sampleScope.features[0], priority: "nice-to-have" }],
    };
    expect(ScopeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a scope with no features", () => {
    expect(ScopeSchema.safeParse({ ...sampleScope, features: [] }).success).toBe(false);
  });
});
