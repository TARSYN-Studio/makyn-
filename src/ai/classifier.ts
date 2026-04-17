import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { config } from "../config";
import { logger } from "../utils/logger";
import { MAKYN_CLASSIFIER_PROMPT_VERSION, MAKYN_CLASSIFIER_SYSTEM_PROMPT } from "./prompts";

const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY
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

export async function classifyMessage(content: string): Promise<{
  classification: MessageClassification;
  promptVersion: string;
}> {
  const startedAt = Date.now();

  const response = await anthropic.messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 1000,
    temperature: 0.2,
    system: MAKYN_CLASSIFIER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: content
      }
    ]
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

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

