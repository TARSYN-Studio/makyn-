import { prisma } from "@makyn/db";
import { z } from "zod";

import { openaiClient, OPENAI_MODEL } from "./client";
import { ACTION_PROMPT_VERSION, ACTION_SYSTEM_PROMPT } from "./prompts";
import type { NoticeClassification } from "./classifier";
import type { ExtractedNotice } from "./extractor";

export type ActionUserContext = {
  fullName: string;
  preferredLanguage: string;
};

const handlerEnum = z.enum(["accountant", "lawyer", "hr_specialist", "founder"]);

const actionSchema = z.object({
  title_ar: z.string(),
  summary_ar: z.string(),
  recommended_action_ar: z.string(),
  recommended_handler: handlerEnum,
  action_deadline_hours: z.number().int().nullable(),
  penalty_if_ignored_ar: z.string(),
  what_to_tell_the_handler_ar: z.string(),
  response_to_user_ar: z.string()
});

export type NoticeAction = z.infer<typeof actionSchema>;

const actionJsonSchema = {
  name: "makyn_action_output",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title_ar: { type: "string" },
      summary_ar: { type: "string" },
      recommended_action_ar: { type: "string" },
      recommended_handler: {
        type: "string",
        enum: ["accountant", "lawyer", "hr_specialist", "founder"]
      },
      action_deadline_hours: { anyOf: [{ type: "integer" }, { type: "null" }] },
      penalty_if_ignored_ar: { type: "string" },
      what_to_tell_the_handler_ar: { type: "string" },
      response_to_user_ar: { type: "string" }
    },
    required: [
      "title_ar",
      "summary_ar",
      "recommended_action_ar",
      "recommended_handler",
      "action_deadline_hours",
      "penalty_if_ignored_ar",
      "what_to_tell_the_handler_ar",
      "response_to_user_ar"
    ]
  }
} as const;

export type ActionResult = {
  action: NoticeAction;
  promptVersion: string;
  latencyMs: number;
};

export async function generateAction(
  extraction: ExtractedNotice,
  classification: NoticeClassification,
  user: ActionUserContext
): Promise<ActionResult> {
  const startedAt = Date.now();
  const client = openaiClient();

  const inputPayload = [
    `USER: ${user.fullName} (preferred language: ${user.preferredLanguage})`,
    "",
    "EXTRACTION:",
    JSON.stringify(extraction, null, 2),
    "",
    "CLASSIFICATION:",
    JSON.stringify(classification, null, 2)
  ].join("\n");

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: ACTION_SYSTEM_PROMPT,
    input: inputPayload,
    text: {
      format: {
        type: "json_schema",
        ...actionJsonSchema
      }
    }
  });

  const raw = response.output_text.trim();
  const action = actionSchema.parse(JSON.parse(raw));
  const latencyMs = Date.now() - startedAt;

  await prisma.aiEventLog.create({
    data: {
      eventType: "ai_stage_3",
      eventData: {
        promptVersion: ACTION_PROMPT_VERSION,
        rawResponse: raw,
        latencyMs
      }
    }
  });

  return { action, promptVersion: ACTION_PROMPT_VERSION, latencyMs };
}
