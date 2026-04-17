import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma, ChannelType } from "@makyn/db";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";

  const [companyCount, telegramChannel] = await Promise.all([
    prisma.company.count({ where: { ownerId: user.id, isActive: true } }),
    prisma.messagingChannel.findFirst({
      where: { userId: user.id, channelType: ChannelType.TELEGRAM, isActive: true },
      select: { id: true }
    })
  ]);

  if (companyCount > 0 && telegramChannel) {
    redirect("/dashboard");
  }

  const step1Done = companyCount > 0;
  const step2Done = Boolean(telegramChannel);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-6">{t("onboarding.title", lang)}</h1>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-7 w-7 rounded-full grid place-items-center text-[13px] font-semibold ${
                    step1Done
                      ? "bg-[var(--green)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-mid)] border border-[var(--border)]"
                  }`}
                >
                  {step1Done ? "✓" : "1"}
                </div>
                <h2 className="font-semibold text-[var(--text)]">{t("onboarding.step1", lang)}</h2>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-[13px] text-[var(--text-mid)] mb-4">{t("onboarding.step1.desc", lang)}</p>
              {!step1Done && (
                <Link href="/companies/new">
                  <Button>{t("onboarding.addCompany", lang)}</Button>
                </Link>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-7 w-7 rounded-full grid place-items-center text-[13px] font-semibold ${
                    step2Done
                      ? "bg-[var(--green)] text-white"
                      : "bg-[var(--surface)] text-[var(--text-mid)] border border-[var(--border)]"
                  }`}
                >
                  {step2Done ? "✓" : "2"}
                </div>
                <h2 className="font-semibold text-[var(--text)]">{t("onboarding.step2", lang)}</h2>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-[13px] text-[var(--text-mid)] mb-4">{t("onboarding.step2.desc", lang)}</p>
              {!step2Done && (
                <Link href="/channels">
                  <Button>{t("onboarding.connectTelegram", lang)}</Button>
                </Link>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="ghost">{t("onboarding.done", lang)}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
