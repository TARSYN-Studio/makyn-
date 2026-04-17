import { Context, NextFunction } from "grammy";

import { logger } from "../../utils/logger";

export async function loggingMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  logger.info(
    {
      updateId: ctx.update.update_id,
      fromId: ctx.from?.id,
      chatId: ctx.chat?.id,
      updateType: Object.keys(ctx.update).find((key) => key !== "update_id")
    },
    "telegram_update_received"
  );

  await next();
}

