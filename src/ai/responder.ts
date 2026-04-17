import Anthropic from "@anthropic-ai/sdk";

import { config } from "../config";
import { CONVERSATION_SUMMARY_PROMPT } from "./prompts";

const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY
});

export async function summarizeConversation(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 150,
    temperature: 0.2,
    system: CONVERSATION_SUMMARY_PROMPT,
    messages: [
      {
        role: "user",
        content: transcript
      }
    ]
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

