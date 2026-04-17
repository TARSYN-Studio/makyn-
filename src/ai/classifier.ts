import OpenAI from "openai";
import { z } from "zod";

import { config } from "../config";
import { logger } from "../utils/logger";
import { MAKYN_CLASSIFIER_PROMPT_VERSION, MAKYN_CLASSIFIER_SYSTEM_PROMPT } from "./prompts";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY
});

const classificationSchema = z.object({
  government_body: z
    .enum([
      "ZATCA",
      "GOSI",
      "MOJ",
      "BOG",
      "EFAA",
      "MHRSD",
      "QIWA",
      "MUQEEM",
      "ABSHER",
      "MOC",
      "BALADY",
      "SAMA",
      "CMA",
      "MONSHAAT",
      "NAFATH",
      "OTHER"
    ])
    .nullable(),
  notice_type_code: z.string().nullable(),
  category: z.enum([
    "government_notice",
    "professional_question_legal",
    "professional_question_accounting",
    "contract_matter",
    "urgent_event",
    "administrative",
    "unclear"
  ]),
  urgency_level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  urgency_reasoning: z.string(),
  detected_deadline_iso: z.string().nullable(),
  detected_amount_sar: z.number().nullable(),
  detected_company_identifier: z.string().nullable(),
  requires_professional: z.boolean(),
  requires_immediate_action: z.boolean(),
  recommended_professional_type: z.enum(["lawyer", "accountant", "both", "none"]),
  suggested_response_ar: z.string(),
  confidence: z.number().min(0).max(1),
  flags_for_founder: z.array(z.string()),
  extracted_key_facts: z.array(z.string())
});

export type MessageClassification = z.infer<typeof classificationSchema>;

const classificationJsonSchema = {
  name: "makyn_classifier_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      government_body: {
        anyOf: [
          {
            type: "string",
            enum: [
              "ZATCA",
              "GOSI",
              "MOJ",
              "BOG",
              "EFAA",
              "MHRSD",
              "QIWA",
              "MUQEEM",
              "ABSHER",
              "MOC",
              "BALADY",
              "SAMA",
              "CMA",
              "MONSHAAT",
              "NAFATH",
              "OTHER"
            ]
          },
          { type: "null" }
        ]
      },
      notice_type_code: {
        anyOf: [{ type: "string" }, { type: "null" }]
      },
      category: {
        type: "string",
        enum: [
          "government_notice",
          "professional_question_legal",
          "professional_question_accounting",
          "contract_matter",
          "urgent_event",
          "administrative",
          "unclear"
        ]
      },
      urgency_level: {
        type: "integer",
        enum: [1, 2, 3, 4, 5]
      },
      urgency_reasoning: { type: "string" },
      detected_deadline_iso: {
        anyOf: [{ type: "string" }, { type: "null" }]
      },
      detected_amount_sar: {
        anyOf: [{ type: "number" }, { type: "null" }]
      },
      detected_company_identifier: {
        anyOf: [{ type: "string" }, { type: "null" }]
      },
      requires_professional: { type: "boolean" },
      requires_immediate_action: { type: "boolean" },
      recommended_professional_type: {
        type: "string",
        enum: ["lawyer", "accountant", "both", "none"]
      },
      suggested_response_ar: { type: "string" },
      confidence: { type: "number" },
      flags_for_founder: {
        type: "array",
        items: { type: "string" }
      },
      extracted_key_facts: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: [
      "government_body",
      "notice_type_code",
      "category",
      "urgency_level",
      "urgency_reasoning",
      "detected_deadline_iso",
      "detected_amount_sar",
      "detected_company_identifier",
      "requires_professional",
      "requires_immediate_action",
      "recommended_professional_type",
      "suggested_response_ar",
      "confidence",
      "flags_for_founder",
      "extracted_key_facts"
    ]
  }
} as const;

export async function classifyMessage(content: string): Promise<{
  classification: MessageClassification;
  promptVersion: string;
}> {
  const startedAt = Date.now();

  const response = await openai.responses.create({
    model: config.OPENAI_MODEL,
    instructions: MAKYN_CLASSIFIER_SYSTEM_PROMPT,
    input: content,
    text: {
      format: {
        type: "json_schema",
        ...classificationJsonSchema
      }
    }
  });

  const text = response.output_text.trim();

  const classification = classificationSchema.parse(JSON.parse(text));

  logger.info(
    {
      confidence: classification.confidence,
      urgency: classification.urgency_level,
      governmentBody: classification.government_body,
      latencyMs: Date.now() - startedAt,
      promptVersion: MAKYN_CLASSIFIER_PROMPT_VERSION
    },
    "classification_completed"
  );

  return {
    classification,
    promptVersion: MAKYN_CLASSIFIER_PROMPT_VERSION
  };
}
