import { User } from "@prisma/client";
import { Context } from "grammy";

import { config } from "../../config";
import { processInboundMessage } from "../../services/message-processor";

type AppContext = Context & {
  state: {
    appUser?: User;
    pendingEditMessageId?: string;
  };
};

export async function handleTextMessage(ctx: AppContext): Promise<void> {
  if (!ctx.state.appUser) {
    return;
  }

  if (ctx.chat?.id === Number(config.FOUNDER_ADMIN_CHAT_ID) && ctx.message?.text) {
    return;
  }

  await processInboundMessage(ctx, ctx.state.appUser, ctx.api);
}
