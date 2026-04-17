import OpenAI from "openai";

let cached: OpenAI | undefined;

export function openaiClient(): OpenAI {
  if (!cached) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    cached = new OpenAI({ apiKey });
  }
  return cached;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
