import { prisma } from "@makyn/db";
import { z } from "zod";

import { openaiClient, OPENAI_MODEL } from "./client";
import { EXTRACTOR_PROMPT_VERSION, EXTRACTOR_SYSTEM_PROMPT } from "./prompts";

export const GOVERNMENT_BODIES = [
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
] as const;

const languageEnum = z.enum(["ar", "en", "mixed"]);
const governmentBodyEnum = z.enum(GOVERNMENT_BODIES);
const amountTypeEnum = z.enum(["fine", "tax_due", "fee", "deposit_required", "refund", "other"]);

const otherIdSchema = z.object({
  type: z.string(),
  value: z.string()
});

const otherDateSchema = z.object({
  type: z.string(),
  date: z.string()
});

const extractionSchema = z.object({
  language_detected: languageEnum,
  sender: z.object({
    government_body: governmentBodyEnum.nullable(),
    specific_office: z.string().nullable(),
    officer_name: z.string().nullable(),
    contact_number: z.string().nullable()
  }),
  recipient: z.object({
    company_name_ar: z.string().nullable(),
    company_name_en: z.string().nullable(),
    cr_number: z.string().nullable(),
    zatca_tin: z.string().nullable(),
    gosi_number: z.string().nullable(),
    qiwa_id: z.string().nullable(),
    balady_license: z.string().nullable(),
    moi700: z.string().nullable(),
    other_ids: z.array(otherIdSchema)
  }),
  notice_reference: z.object({
    reference_number: z.string().nullable(),
    case_number: z.string().nullable(),
    file_number: z.string().nullable(),
    issued_date: z.string().nullable()
  }),
  financial: z.object({
    amount_sar: z.number().nullable(),
    amount_type: amountTypeEnum.nullable(),
    is_compound_penalty: z.boolean(),
    compound_description: z.string().nullable()
  }),
  dates: z.object({
    response_deadline: z.string().nullable(),
    hearing_date: z.string().nullable(),
    payment_deadline: z.string().nullable(),
    other_dates: z.array(otherDateSchema)
  }),
  key_facts: z.array(z.string()),
  raw_arabic_excerpt: z.string().nullable()
});

export type ExtractedNotice = z.infer<typeof extractionSchema>;

const extractionJsonSchema = {
  name: "makyn_extractor_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      language_detected: { type: "string", enum: ["ar", "en", "mixed"] },
      sender: {
        type: "object",
        additionalProperties: false,
        properties: {
          government_body: { anyOf: [{ type: "string", enum: [...GOVERNMENT_BODIES] }, { type: "null" }] },
          specific_office: { anyOf: [{ type: "string" }, { type: "null" }] },
          officer_name: { anyOf: [{ type: "string" }, { type: "null" }] },
          contact_number: { anyOf: [{ type: "string" }, { type: "null" }] }
        },
        required: ["government_body", "specific_office", "officer_name", "contact_number"]
      },
      recipient: {
        type: "object",
        additionalProperties: false,
        properties: {
          company_name_ar: { anyOf: [{ type: "string" }, { type: "null" }] },
          company_name_en: { anyOf: [{ type: "string" }, { type: "null" }] },
          cr_number: { anyOf: [{ type: "string" }, { type: "null" }] },
          zatca_tin: { anyOf: [{ type: "string" }, { type: "null" }] },
          gosi_number: { anyOf: [{ type: "string" }, { type: "null" }] },
          qiwa_id: { anyOf: [{ type: "string" }, { type: "null" }] },
          balady_license: { anyOf: [{ type: "string" }, { type: "null" }] },
          moi700: { anyOf: [{ type: "string" }, { type: "null" }] },
          other_ids: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { type: { type: "string" }, value: { type: "string" } },
              required: ["type", "value"]
            }
          }
        },
        required: [
          "company_name_ar",
          "company_name_en",
          "cr_number",
          "zatca_tin",
          "gosi_number",
          "qiwa_id",
          "balady_license",
          "moi700",
          "other_ids"
        ]
      },
      notice_reference: {
        type: "object",
        additionalProperties: false,
        properties: {
          reference_number: { anyOf: [{ type: "string" }, { type: "null" }] },
          case_number: { anyOf: [{ type: "string" }, { type: "null" }] },
          file_number: { anyOf: [{ type: "string" }, { type: "null" }] },
          issued_date: { anyOf: [{ type: "string" }, { type: "null" }] }
        },
        required: ["reference_number", "case_number", "file_number", "issued_date"]
      },
      financial: {
        type: "object",
        additionalProperties: false,
        properties: {
          amount_sar: { anyOf: [{ type: "number" }, { type: "null" }] },
          amount_type: {
            anyOf: [
              { type: "string", enum: ["fine", "tax_due", "fee", "deposit_required", "refund", "other"] },
              { type: "null" }
            ]
          },
          is_compound_penalty: { type: "boolean" },
          compound_description: { anyOf: [{ type: "string" }, { type: "null" }] }
        },
        required: ["amount_sar", "amount_type", "is_compound_penalty", "compound_description"]
      },
      dates: {
        type: "object",
        additionalProperties: false,
        properties: {
          response_deadline: { anyOf: [{ type: "string" }, { type: "null" }] },
          hearing_date: { anyOf: [{ type: "string" }, { type: "null" }] },
          payment_deadline: { anyOf: [{ type: "string" }, { type: "null" }] },
          other_dates: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { type: { type: "string" }, date: { type: "string" } },
              required: ["type", "date"]
            }
          }
        },
        required: ["response_deadline", "hearing_date", "payment_deadline", "other_dates"]
      },
      key_facts: { type: "array", items: { type: "string" } },
      raw_arabic_excerpt: { anyOf: [{ type: "string" }, { type: "null" }] }
    },
    required: [
      "language_detected",
      "sender",
      "recipient",
      "notice_reference",
      "financial",
      "dates",
      "key_facts",
      "raw_arabic_excerpt"
    ]
  }
} as const;

export type ExtractorResult = {
  extraction: ExtractedNotice;
  promptVersion: string;
  latencyMs: number;
};

export async function extractNotice(rawText: string): Promise<ExtractorResult> {
  const startedAt = Date.now();
  const client = openaiClient();

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: EXTRACTOR_SYSTEM_PROMPT,
    input: rawText,
    text: {
      format: {
        type: "json_schema",
        ...extractionJsonSchema
      }
    }
  });

  const raw = response.output_text.trim();
  const extraction = extractionSchema.parse(JSON.parse(raw));
  const latencyMs = Date.now() - startedAt;

  await prisma.auditLog.create({
    data: {
      eventType: "ai_stage_1",
      eventData: {
        promptVersion: EXTRACTOR_PROMPT_VERSION,
        rawResponse: raw,
        latencyMs
      }
    }
  });

  return { extraction, promptVersion: EXTRACTOR_PROMPT_VERSION, latencyMs };
}
