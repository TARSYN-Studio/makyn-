import http from "node:http";

import { Bot, Context, webhookCallback } from "grammy";

import { config } from "../config";
import { logger } from "../utils/logger";
import { handleStartCommand } from "./handlers/start";
import { handleInboundMessage } from "./handlers/message";
import { handleDisambiguateCallback } from "./handlers/disambiguate";
import { handleUnconnectedMessage } from "./handlers/unconnected";
import { channelContextMiddleware } from "./middleware/channel-context";
import { loggingMiddleware } from "./middleware/logging";

export type AppContext = Context & {
  state: {
    channelId?: string;
    connectedUserId?: string;
    connectedFullName?: string;
    connectedLanguage?: string;
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
  bot.use(channelContextMiddleware);

  bot.command("start", handleStartCommand);

  bot.callbackQuery(/^dis:([^:]+):([^:]+)$/, handleDisambiguateCallback);

  const connectedOnly = async (ctx: AppContext, next: () => Promise<void>) => {
    if (!ctx.state.connectedUserId) {
      await handleUnconnectedMessage(ctx);
      return;
    }
    await next();
  };

  bot.on(["message:text", "message:photo", "message:document", "message:voice"], connectedOnly, handleInboundMessage);

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
