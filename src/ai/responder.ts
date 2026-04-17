import OpenAI from "openai";

import { config } from "../config";
import { CONVERSATION_SUMMARY_PROMPT } from "./prompts";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY
});

export async function summarizeConversation(transcript: string): Promise<string> {
  const response = await openai.responses.create({
    model: config.OPENAI_MODEL,
    instructions: CONVERSATION_SUMMARY_PROMPT,
    input: transcript
  });

  return response.output_text.trim();
}
