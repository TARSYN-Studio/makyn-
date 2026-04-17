import type { AppContext } from "../bot";

const SIGNUP_PROMPT =
  "👋 مرحباً! للاستفادة من خدمات مكين، يرجى التسجيل أولاً عبر https://app.makyn.site ثم ربط حساب Telegram من لوحة التحكم.";

const PROMPT_COOLDOWN_MS = 60 * 60 * 1000;
const lastPromptAt = new Map<number, number>();

export async function handleUnconnectedMessage(ctx: AppContext): Promise<void> {
  if (ctx.state.connectedUserId) return;
  if (!ctx.from) return;

  const now = Date.now();
  const last = lastPromptAt.get(ctx.from.id) ?? 0;
  if (now - last < PROMPT_COOLDOWN_MS) return;

  lastPromptAt.set(ctx.from.id, now);
  await ctx.reply(SIGNUP_PROMPT);
}
