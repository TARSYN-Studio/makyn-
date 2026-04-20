import { ChannelType, prisma } from "@makyn/db";

import { ConnectTelegramCard } from "./connect-telegram";
import { DisconnectTelegramButton } from "./disconnect-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
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

  const telegram = await prisma.messagingChannel.findFirst({
    where: { userId: user.id, channelType: ChannelType.TELEGRAM, isActive: true },
    select: { externalHandle: true, lastUsedAt: true, connectedAt: true }
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-[var(--ink)] mb-6">{t("channels.title", lang)}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--ink)]">{t("channels.telegram", lang)}</h2>
              {telegram ? (
                <Badge variant="done">✅</Badge>
              ) : (
                <Badge variant="neutral">—</Badge>
              )}
            </div>
          </CardHeader>
          <CardBody>
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
          </CardBody>
        </Card>

        <Card className="border-[var(--signal-tint)] bg-[var(--signal-tint)] relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--ink)]">{t("channels.whatsapp", lang)}</h2>
              <Badge variant="accent">{t("channels.whatsapp.soon", lang)}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-[13px] text-[var(--ink-60)]">{t("channels.whatsapp.desc", lang)}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
