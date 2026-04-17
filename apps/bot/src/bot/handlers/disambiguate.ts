import { runPipelineForDisambiguation, type UserContext } from "../services/pipeline-runner";
import type { AppContext } from "../bot";
import { logger } from "../../utils/logger";

export async function handleDisambiguateCallback(ctx: AppContext): Promise<void> {
  const connectedUserId = ctx.state.connectedUserId;
  const fullName = ctx.state.connectedFullName;
  const preferredLanguage = ctx.state.connectedLanguage;

  if (!connectedUserId || !fullName || !preferredLanguage) {
    await ctx.answerCallbackQuery({ text: "غير مصرح", show_alert: true });
    return;
  }

  if (!ctx.match) {
    await ctx.answerCallbackQuery();
    return;
  }

  const [, messageId, companyId] = ctx.match;

  if (!messageId) {
    await ctx.answerCallbackQuery();
    return;
  }

  if (companyId === "none") {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "تم تسجيل الرسالة دون ربطها بشركة. هل يمكنك إخباري بمزيد من التفاصيل؟"
    );
    return;
  }

  const user: UserContext = { userId: connectedUserId, fullName, preferredLanguage };

  try {
    const outcome = await runPipelineForDisambiguation(user, messageId, companyId);
    if (!outcome) {
      await ctx.answerCallbackQuery({ text: "تعذر تنفيذ الاختيار", show_alert: true });
      return;
    }

    await ctx.answerCallbackQuery({ text: "تم الربط بالشركة" });
    await ctx.editMessageText(outcome.responseAr);
  } catch (error) {
    logger.error({ error, messageId, companyId }, "disambiguation_failed");
    await ctx.answerCallbackQuery({ text: "حدث خطأ أثناء المعالجة", show_alert: true });
  }
}
