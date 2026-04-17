import { NextFunction } from "grammy";

import { resolveConnectedUser } from "../services/channel";
import type { AppContext } from "../bot";

export async function channelContextMiddleware(ctx: AppContext, next: NextFunction): Promise<void> {
  if (ctx.from) {
    const resolved = await resolveConnectedUser(BigInt(ctx.from.id));
    if (resolved) {
      ctx.state.connectedUserId = resolved.userId;
      ctx.state.connectedFullName = resolved.fullName;
      ctx.state.connectedLanguage = resolved.preferredLanguage;
      ctx.state.channelId = resolved.channelId;
    }
  }
  await next();
}
