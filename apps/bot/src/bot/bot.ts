import http from "node:http";

import { Prisma, prisma } from "@makyn/db";
import { Bot, Context } from "grammy";
import type { Update } from "grammy/types";

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

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Returns true if this update_id was seen before and should be skipped.
// On DB failure we log and allow processing — better to risk a duplicate
// than drop a real update.
async function isDuplicateUpdate(updateId: number): Promise<boolean> {
  try {
    await prisma.telegramUpdate.create({ data: { updateId: BigInt(updateId) } });
    return false;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return true;
    }
    logger.error({ error, updateId }, "telegram_update_dedup_failed");
    return false;
  }
}

export function createWebhookServer(bot: Bot<AppContext>): http.Server {
  return http.createServer(async (req, res) => {
    if (req.method !== "POST" || !req.url?.startsWith(`/webhook/${config.TELEGRAM_WEBHOOK_SECRET}`)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    if (req.headers["x-telegram-bot-api-secret-token"] !== config.TELEGRAM_WEBHOOK_SECRET) {
      res.statusCode = 401;
      res.end("Unauthorized");
      return;
    }

    let update: Update;
    try {
      update = JSON.parse(await readBody(req)) as Update;
    } catch {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }

    if (await isDuplicateUpdate(update.update_id)) {
      logger.info({ updateId: update.update_id }, "telegram_update_duplicate_skipped");
      res.statusCode = 200;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.end();

    bot.handleUpdate(update).catch((err) => {
      logger.error({ err, updateId: update.update_id }, "telegram_handle_update_failed");
    });
  });
}
