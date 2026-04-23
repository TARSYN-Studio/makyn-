import { ChannelType, prisma } from "@makyn/db";

import { ConnectTelegramCard } from "./connect-telegram";
import { DisconnectTelegramButton } from "./disconnect-button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/Reveal";
import { StatusDot } from "@/components/motion/StatusDot";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

function relative(date: Date | null, lang: Lang): string {
  if (!date) return "—";
  const h = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (h < 1) return lang === "ar" ? "قبل دقائق" : "minutes ago";
  if (h < 24) return lang === "ar" ? `قبل ${h} ساعة` : `${h}h ago`;
  return lang === "ar" ? `قبل ${Math.round(h / 24)} يوم` : `${Math.round(h / 24)}d ago`;
}

export default async function ChannelsPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const isAr = lang === "ar";

  const telegram = await prisma.messagingChannel.findFirst({
    where: { userId: user.id, channelType: ChannelType.TELEGRAM, isActive: true },
    select: { externalHandle: true, lastUsedAt: true, connectedAt: true }
  });

  return (
    <div className="max-w-[900px] mx-auto">
      <Reveal>
        <div className="pt-6 pb-6 border-b border-[var(--stone-hair)] mb-6">
          <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
            {isAr ? "القنوات" : "Channels"}
          </div>
          <h1
            className={`text-[36px] md:text-[44px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {t("channels.title", lang)}
          </h1>
          <p
            className={`font-display-it text-[16px] md:text-[18px] text-[var(--ink-60)] mt-2 max-w-[520px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr
              ? "كيف يصلك مكين، وكيف ترسل له."
              : "How MAKYN reaches you, and how you reach MAKYN."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--stone-hair)] bg-[var(--card)] elev-1 overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--stone-hair)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--ink)] text-[14px]">
                {t("channels.telegram", lang)}
              </h2>
              {telegram ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-[var(--state-resolved)]">
                  <StatusDot status="healthy" size={6} />
                  {isAr ? "موصول" : "Connected"}
                </span>
              ) : (
                <Badge variant="neutral">—</Badge>
              )}
            </div>
            <div className="px-5 py-4">
              {telegram ? (
                <div className="space-y-3 text-[13px] text-[var(--ink)]">
                  <div>
                    {t("channels.telegram.connected", lang)}{" "}
                    <span className="font-medium num">@{telegram.externalHandle ?? "?"}</span>
                  </div>
                  <div className="text-[12px] text-[var(--ink-40)] num">
                    {t("channels.telegram.lastUsed", lang)}: {relative(telegram.lastUsedAt, lang)}
                  </div>
                  <DisconnectTelegramButton lang={lang} />
                </div>
              ) : (
                <ConnectTelegramCard lang={lang} />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--signal)]/20 bg-[var(--signal-tint)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--signal)]/20 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--ink)] text-[14px]">
                {t("channels.whatsapp", lang)}
              </h2>
              <Badge variant="accent">{t("channels.whatsapp.soon", lang)}</Badge>
            </div>
            <div className="px-5 py-4">
              <p className={`text-[13px] text-[var(--ink-60)] ${isAr ? "text-ar" : ""}`}>
                {t("channels.whatsapp.desc", lang)}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
