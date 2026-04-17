import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16).optional().default("dev-only-change-in-production-xxxxxxxxxxxx"),
  TELEGRAM_BOT_USERNAME: z.string().default("MAKYN_BOT"),
  APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
  APP_URL: process.env.APP_URL,
  NODE_ENV: process.env.NODE_ENV
});
