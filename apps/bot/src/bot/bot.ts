import http from "node:http";

import { Bot, Context, webhookCallback } from "grammy";

import { config } from "../config";
import { logger } from "../utils/logger";
import { loggingMiddleware } from "./middleware/logging";

export type AppContext = Context & {
  state: {
    channelUserId?: string;
    connectedUserId?: string;
    pendingEditMessageId?: string;
  };
};

export function createBot(): Bot<AppContext> {
  const bot = new Bot<AppContext>(config.TELEGRAM_BOT_TOKEN);

  bot.use(async (ctx, next) => {
    ctx.state = ctx.state ?? {};
    await next();
  });

  bot.use(loggingMiddleware);

  bot.on("message", async (ctx) => {
    await ctx.reply("MAKYN تحت الترقية للإصدار v1. سيعود قريباً.");
  });

  bot.catch((error) => {
    logger.error({ error }, "telegram_bot_error");
  });

  return bot;
}

export async function registerWebhook(bot: Bot<AppContext>): Promise<void> {
  await bot.api.setWebhook(config.TELEGRAM_WEBHOOK_URL, {
    secret_token: config.TELEGRAM_WEBHOOK_SECRET
  });
}

export function createWebhookServer(bot: Bot<AppContext>): http.Server {
  const handler = webhookCallback(bot, "http");

  return http.createServer(async (req, res) => {
    if (!req.url?.startsWith(`/webhook/${config.TELEGRAM_WEBHOOK_SECRET}`)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    if (req.headers["x-telegram-bot-api-secret-token"] !== config.TELEGRAM_WEBHOOK_SECRET) {
      res.statusCode = 401;
      res.end("Unauthorized");
      return;
    }

    await handler(req, res);
  });
}
