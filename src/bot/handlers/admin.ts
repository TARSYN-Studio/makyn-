import { Bot, Context } from "grammy";

import { config } from "../../config";
import { handleApprove, handleEditedResponse, handleEscalate, handleReject } from "../../services/admin-notifier";

type AppContext = Context & {
  state: {
    pendingEditMessageId?: string;
  };
};

const founderEditSessions = new Map<number, string>();

export function registerAdminHandlers(bot: Bot<AppContext>): void {
  bot.callbackQuery(/^admin:(approve|edit|reject|escalate):(.+)$/, async (ctx) => {
    if (ctx.chat?.id !== Number(config.FOUNDER_ADMIN_CHAT_ID) || ctx.from?.id !== Number(config.FOUNDER_TELEGRAM_USER_ID)) {
      await ctx.answerCallbackQuery({ text: "Unauthorized", show_alert: true });
      return;
    }

    const action = ctx.match[1];
    const messageId = ctx.match[2];

    if (action === "approve") {
      await handleApprove(ctx.api, messageId);
      await ctx.answerCallbackQuery({ text: "Approved and sent." });
      return;
    }

    if (action === "edit") {
      founderEditSessions.set(ctx.from.id, messageId);
      await ctx.reply("Send your edited response:");
      await ctx.answerCallbackQuery({ text: "Waiting for edited text." });
      return;
    }

    if (action === "reject") {
      await handleReject(messageId);
      await ctx.answerCallbackQuery({ text: "Rejected." });
      return;
    }

    await handleEscalate(ctx.api, messageId);
    await ctx.answerCallbackQuery({ text: "Escalated." });
  });

  bot.on("message:text", async (ctx, next) => {
    if (ctx.chat?.id === Number(config.FOUNDER_ADMIN_CHAT_ID) && ctx.from?.id === Number(config.FOUNDER_TELEGRAM_USER_ID)) {
      const pendingMessageId = founderEditSessions.get(ctx.from.id);
      if (pendingMessageId && ctx.message.text) {
        founderEditSessions.delete(ctx.from.id);
        await handleEditedResponse(ctx.api, pendingMessageId, ctx.message.text);
        await ctx.reply("Edited response sent.");
        return;
      }
    }

    await next();
  });
}
