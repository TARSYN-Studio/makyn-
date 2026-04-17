import fs from "node:fs";

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  TELEGRAM_WEBHOOK_URL: z.string().url(),
  FOUNDER_TELEGRAM_USER_ID: z.coerce.bigint(),
  FOUNDER_ADMIN_CHAT_ID: z.coerce.bigint(),
  DATABASE_URL: z.string().min(1),
  DATABASE_CA_CERT_PATH: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  PORT: z.coerce.number().int().positive().default(8080),
  AUTO_SEND_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.85),
  AUTO_SEND_MAX_URGENCY: z.coerce.number().int().min(1).max(5).default(3)
});

const parsed = envSchema.parse(process.env);

if (!fs.existsSync(parsed.DATABASE_CA_CERT_PATH) && parsed.NODE_ENV === "production") {
  throw new Error(`DATABASE_CA_CERT_PATH not found: ${parsed.DATABASE_CA_CERT_PATH}`);
}

if (!fs.existsSync(parsed.GOOGLE_APPLICATION_CREDENTIALS) && parsed.NODE_ENV === "production") {
  throw new Error(`GOOGLE_APPLICATION_CREDENTIALS not found: ${parsed.GOOGLE_APPLICATION_CREDENTIALS}`);
}

export const config = parsed;
