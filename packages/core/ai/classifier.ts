import { prisma } from "@makyn/db";
import { z } from "zod";

import { openaiClient, OPENAI_MODEL } from "./client";
import { CLASSIFIER_PROMPT_VERSION, CLASSIFIER_SYSTEM_PROMPT } from "./prompts";
import type { ExtractedNotice } from "./extractor";

export type CompanyForMatching = {
  id: string;
  legalNameAr: string;
  legalNameEn: string | null;
  tradeName: string | null;
  crNumber: string | null;
  zatcaTin: string | null;
  gosiEmployerNumber: string | null;
  qiwaEstablishmentId: string | null;
};

const matchMethodEnum = z.enum(["cr", "tin", "gosi", "qiwa", "name_fuzzy", "none"]);
const professionalTypeEnum = z.enum(["accountant", "lawyer", "hr_specialist", "none"]);

const classificationSchema = z.object({
  notice_type_code: z.string(),
  notice_type_description_ar: z.string(),
  urgency_level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  urgency_reasoning: z.string(),
  matched_company_id: z.string().nullable(),
  match_confidence: z.number().min(0).max(1),
  match_method: matchMethodEnum,
  requires_professional: z.boolean(),
  recommended_professional_type: professionalTypeEnum,
  requires_immediate_action: z.boolean(),
  why_this_urgency: z.string()
});

export type NoticeClassification = z.infer<typeof classificationSchema>;

const classificationJsonSchema = {
  name: "makyn_classifier_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      notice_type_code: { type: "string" },
      notice_type_description_ar: { type: "string" },
      urgency_level: { type: "integer", enum: [1, 2, 3, 4, 5] },
      urgency_reasoning: { type: "string" },
      matched_company_id: { anyOf: [{ type: "string" }, { type: "null" }] },
      match_confidence: { type: "number" },
      match_method: {
        type: "string",
        enum: ["cr", "tin", "gosi", "qiwa", "name_fuzzy", "none"]
      },
      requires_professional: { type: "boolean" },
      recommended_professional_type: {
        type: "string",
        enum: ["accountant", "lawyer", "hr_specialist", "none"]
      },
      requires_immediate_action: { type: "boolean" },
      why_this_urgency: { type: "string" }
    },
    required: [
      "notice_type_code",
      "notice_type_description_ar",
      "urgency_level",
      "urgency_reasoning",
      "matched_company_id",
      "match_confidence",
      "match_method",
      "requires_professional",
      "recommended_professional_type",
      "requires_immediate_action",
      "why_this_urgency"
    ]
  }
} as const;

export type ClassifierResult = {
  classification: NoticeClassification;
  promptVersion: string;
  latencyMs: number;
};

function formatCompanies(companies: CompanyForMatching[]): string {
  if (companies.length === 0) {
    return "User owns NO companies yet. matched_company_id must be null, match_method must be 'none'.";
  }
  const rows = companies.map((c) => {
    const parts: string[] = [];
    if (c.crNumber) parts.push(`CR: ${c.crNumber}`);
    if (c.zatcaTin) parts.push(`TIN: ${c.zatcaTin}`);
    if (c.gosiEmployerNumber) parts.push(`GOSI: ${c.gosiEmployerNumber}`);
    if (c.qiwaEstablishmentId) parts.push(`Qiwa: ${c.qiwaEstablishmentId}`);
    const ids = parts.length ? ` (${parts.join(", ")})` : "";
    const tradeBit = c.tradeName ? ` — trade name: ${c.tradeName}` : "";
    return `- ${c.id}: ${c.legalNameAr}${tradeBit}${ids}`;
  });
  return `User owns these companies:\n${rows.join("\n")}`;
}

export async function classifyNotice(
  extraction: ExtractedNotice,
  rawText: string,
  companies: CompanyForMatching[]
): Promise<ClassifierResult> {
  const startedAt = Date.now();
  const client = openaiClient();

  const inputPayload = [
    formatCompanies(companies),
    "",
    "EXTRACTED DATA:",
    JSON.stringify(extraction, null, 2),
    "",
    "ORIGINAL NOTICE TEXT:",
    rawText
  ].join("\n");

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: CLASSIFIER_SYSTEM_PROMPT,
    input: inputPayload,
    text: {
      format: {
        type: "json_schema",
        ...classificationJsonSchema
      }
    }
  });

  const raw = response.output_text.trim();
  const classification = classificationSchema.parse(JSON.parse(raw));
  const latencyMs = Date.now() - startedAt;

  await prisma.auditLog.create({
    data: {
      eventType: "ai_stage_2",
      eventData: {
        promptVersion: CLASSIFIER_PROMPT_VERSION,
        rawResponse: raw,
        companyCount: companies.length,
        latencyMs
      }
    }
  });

  return { classification, promptVersion: CLASSIFIER_PROMPT_VERSION, latencyMs };
}
