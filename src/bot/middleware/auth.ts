import { UserRole } from "@prisma/client";
import { Context, NextFunction } from "grammy";

import { prisma } from "../../db/client";

type AppContext = Context & {
  state: {
    appUser?: Awaited<ReturnType<typeof prisma.user.findUnique>> extends infer T ? Exclude<T, null> : never;
    pendingEditMessageId?: string;
  };
};

function getMessageType(ctx: Context): string {
  if (ctx.message?.text) return "text";
  if (ctx.message?.photo) return "photo";
  if (ctx.message?.document) return "document";
  if (ctx.message?.voice) return "voice";
  if (ctx.callbackQuery) return "callback_query";
  return "unknown";
}

export async function authMiddleware(ctx: AppContext, next: NextFunction): Promise<void> {
  const from = ctx.from;
  if (!from) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(from.id) }
  });

  if (!user || !user.isActive || user.role === UserRole.BLOCKED) {
    await prisma.auditLog.create({
      data: {
        eventType: "unauthorized_attempt",
        eventData: {
          telegramId: from.id,
          username: from.username ?? null,
          messageType: getMessageType(ctx)
        }
      }
    });
    return;
  }

  ctx.state.appUser = user;
  await next();
}
