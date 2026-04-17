import { ContentType } from "@makyn/db";
import { InlineKeyboard } from "grammy";

import { runPipelineForInbound, type UserContext } from "../services/pipeline-runner";
import { ingestTelegramMessage } from "../services/message-ingest";
import type { AppContext } from "../bot";
import { logger } from "../../utils/logger";

const HOLDING_REPLY = "استلمنا رسالتك، أستاذ. الفريق يقرأها الآن وسنعود إليك بالتفاصيل قريباً.";
const VOICE_NOT_SUPPORTED = "الرسائل الصوتية غير مدعومة حالياً. يرجى إرسال نص أو صورة أو PDF.";
const NO_COMPANIES_YET =
  "لم تُضف أي شركات بعد في لوحة التحكم. يرجى فتح https://app.makyn.site وإضافة شركتك قبل إرسال الإشعارات.";

function buildDisambiguationKeyboard(
  messageId: string,
  companies: { id: string; legalNameAr: string; tradeName: string | null }[]
): InlineKeyboard {
  const kb = new InlineKeyboard();
  companies.forEach((company, index) => {
    const label = company.tradeName ?? company.legalNameAr;
    kb.text(label.slice(0, 30), `dis:${messageId}:${company.id}`);
    if ((index + 1) % 2 === 0) kb.row();
  });
  kb.row().text("ليس متعلقاً بشركة / أخرى", `dis:${messageId}:none`);
  return kb;
}

export async function handleInboundMessage(ctx: AppContext): Promise<void> {
  const connectedUserId = ctx.state.connectedUserId;
  const fullName = ctx.state.connectedFullName;
  const preferredLanguage = ctx.state.connectedLanguage;

  if (!connectedUserId || !fullName || !preferredLanguage) return;

  const user: UserContext = { userId: connectedUserId, fullName, preferredLanguage };

  try {
    const ingested = await ingestTelegramMessage(ctx);

    if (ingested.contentType === ContentType.VOICE) {
      await ctx.reply(VOICE_NOT_SUPPORTED);
      return;
    }

    await ctx.reply(HOLDING_REPLY);

    const outcome = await runPipelineForInbound(user, ingested);

    if (outcome.kind === "no_companies") {
      await ctx.reply(NO_COMPANIES_YET);
      return;
    }

    if (outcome.kind === "disambiguation_needed") {
      await ctx.reply(
        "لم أتمكن من تحديد الشركة المعنية. أي شركة تخص هذه الرسالة؟",
        { reply_markup: buildDisambiguationKeyboard(outcome.messageId, outcome.companies) }
      );
      return;
    }

    await ctx.reply(outcome.responseAr);
  } catch (error) {
    logger.error({ error, userId: connectedUserId }, "pipeline_run_failed");
    await ctx.reply(
      "حدث خطأ أثناء معالجة الرسالة. فريق مكين يراجع الوضع — سنعود إليك قريباً."
    );
  }
}
