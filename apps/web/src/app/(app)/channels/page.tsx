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
      <h1 className="text-2xl font-semibold text-navy-800 mb-6">{t("channels.title", lang)}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-navy-800">{t("channels.telegram", lang)}</h2>
              {telegram ? (
                <Badge variant="green">✅</Badge>
              ) : (
                <Badge variant="neutral">—</Badge>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {telegram ? (
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  {t("channels.telegram.connected", lang)}{" "}
                  <span className="font-medium">@{telegram.externalHandle ?? "?"}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {t("channels.telegram.lastUsed", lang)}: {relative(telegram.lastUsedAt, lang)}
                </div>
                <DisconnectTelegramButton lang={lang} />
              </div>
            ) : (
              <ConnectTelegramCard lang={lang} />
            )}
          </CardBody>
        </Card>

        <Card className="border-gold-500/30 bg-gold-500/5 relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-navy-800">{t("channels.whatsapp", lang)}</h2>
              <Badge variant="gold">{t("channels.whatsapp.soon", lang)}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-600">{t("channels.whatsapp.desc", lang)}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
