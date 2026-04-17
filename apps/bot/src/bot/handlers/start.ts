import { Context } from "grammy";

import { claimConnectToken } from "../services/channel";
import { logger } from "../../utils/logger";

const WELCOME_UNCONNECTED =
  "👋 مرحباً بك في مكين. للبدء، يرجى التسجيل عبر https://app.makyn.site ثم ربط حساب Telegram من لوحة التحكم.";

const TOKEN_EXPIRED =
  "الرابط منتهي الصلاحية. يرجى العودة إلى لوحة التحكم وإنشاء رابط جديد.";

const TOKEN_USED =
  "تم استخدام هذا الرابط مسبقاً. يرجى إنشاء رابط جديد من لوحة التحكم إذا لزم الأمر.";

const TOKEN_INVALID =
  "الرابط غير صالح. يرجى فتح لوحة التحكم في https://app.makyn.site وإنشاء رابط اتصال جديد.";

function successMessage(fullName: string): string {
  return [
    `✅ تم ربط حسابك بنجاح، أستاذ ${fullName}.`,
    "",
    "الآن أرسل لي أي إشعار حكومي تستلمه — نص، صورة، أو ملف PDF — وسأساعدك في فهمه وتحديد الخطوة التالية."
  ].join("\n");
}

export async function handleStartCommand(ctx: Context): Promise<void> {
  const payload = ctx.match?.toString().trim() ?? "";

  if (!payload) {
    await ctx.reply(WELCOME_UNCONNECTED);
    return;
  }

  if (!payload.startsWith("connect_")) {
    await ctx.reply(WELCOME_UNCONNECTED);
    return;
  }

  const tokenValue = payload.slice("connect_".length);
  if (!tokenValue || !ctx.from) {
    await ctx.reply(TOKEN_INVALID);
    return;
  }

  const result = await claimConnectToken(tokenValue, BigInt(ctx.from.id), ctx.from.username ?? null);

  if (!result.ok) {
    if (result.reason === "expired") {
      await ctx.reply(TOKEN_EXPIRED);
    } else if (result.reason === "used") {
      await ctx.reply(TOKEN_USED);
    } else {
      await ctx.reply(TOKEN_INVALID);
    }
    return;
  }

  logger.info({ telegramId: ctx.from.id, userId: result.userId }, "telegram_channel_connected");
  await ctx.reply(successMessage(result.fullName));
}
