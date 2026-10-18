import { z } from "zod";
import { FEATURE_TYPES, INTEGRATION_TYPES } from "./catalog";

export const PROJECT_TYPES = [
  "website",
  "web_app",
  "mobile_app",
  "ecommerce",
  "marketplace",
  "saas",
  "ai_feature",
  "internal_tool",
  "other",
] as const;
export const PRIORITIES = ["must", "should", "could"] as const;
export const SEVERITIES = ["low", "medium", "high"] as const;

export type Severity = (typeof SEVERITIES)[number];

// Descriptions are part of the JSON Schema sent to Groq, so they double as instructions to the model.
const Feature = z.object({
  name: z.string().describe("Short feature name, 2-5 words, unique within the scope"),
  description: z.string().describe("One sentence on what the user can do"),
  priority: z
    .enum(PRIORITIES)
    .describe("MoSCoW priority, as defined in the instructions"),
  type: z.enum(FEATURE_TYPES).describe("The feature type from the catalogue in the instructions that fits best"),
});

const Integration = z.object({
  name: z.string().describe("Third-party service or system, e.g. Stripe, Google Calendar, an existing ERP"),
  purpose: z.string().describe("Why the project needs it"),
  type: z.enum(INTEGRATION_TYPES).describe("The integration type from the catalogue in the instructions that fits best"),
});

const Risk = z.object({
  title: z.string(),
  detail: z.string().describe("What could go wrong and why"),
  severity: z.enum(SEVERITIES),
  mitigation: z.string().describe("One concrete step that reduces the risk"),
});

const Milestone = z.object({
  name: z.string(),
  goal: z.string().describe("What is usable at the end of this milestone"),
  featureNames: z.array(z.string()).describe("Names of features delivered in this milestone, exactly as listed in features"),
});

export const ScopeSchema = z
  .object({
    projectTitle: z.string().describe("Short descriptive project title"),
    summary: z.string().describe("Two or three sentences: who it is for and the core value"),
    projectType: z.enum(PROJECT_TYPES),
    assumptions: z.array(z.string()).describe("Things assumed because the brief did not say"),
    openQuestions: z.array(z.string()).describe("Questions to ask the client on the first call"),
    features: z.array(Feature),
    integrations: z.array(Integration),
    risks: z.array(Risk),
    milestones: z.array(Milestone).describe("Ordered delivery phases; every must-have feature appears in one"),
  })
  // Checked after parsing; kept out of the JSON Schema because Groq strict mode may not support minItems.
  // A failure here sends the request to the next model.
  // The prompt asks for 4-8 features; a count outside 3-10 means the model ignored it.
  .refine((s) => s.features.length >= 3 && s.features.length <= 10, {
    message: "Scope must list between 3 and 10 features",
    path: ["features"],
  })
  .refine((s) => s.features.some((f) => f.priority === "must"), {
    message: "Scope must have at least one must-have feature, or the MVP is empty",
    path: ["features"],
  });

export type Scope = z.infer<typeof ScopeSchema>;

// JSON Schema for Groq's `response_format`, without the `$schema` URI the API does not need.
export const scopeJsonSchema = z.toJSONSchema(ScopeSchema, { target: "draft-2020-12" });
delete scopeJsonSchema.$schema;
