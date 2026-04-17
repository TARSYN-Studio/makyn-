import { User } from "@prisma/client";
import { Context } from "grammy";

import { processInboundMessage } from "../../services/message-processor";

type AppContext = Context & {
  state: {
    appUser?: User;
  };
};

export async function handlePhotoMessage(ctx: AppContext): Promise<void> {
  if (!ctx.state.appUser) {
    return;
  }

  await processInboundMessage(ctx, ctx.state.appUser, ctx.api);
}
