import { prisma } from "@makyn/db";

import { ProfileForm } from "./profile-form";
import { EndSessionButton } from "./end-session";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";

  const [fullUser, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { id: true, fullName: true, email: true, phoneNumber: true, preferredLanguage: true }
    }),
    prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { lastUsedAt: "desc" },
      select: { id: true, userAgent: true, ipAddress: true, lastUsedAt: true, createdAt: true }
    })
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-navy-800">{t("settings.title", lang)}</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy-800">{t("settings.profile", lang)}</h2>
        </CardHeader>
        <CardBody>
          <ProfileForm user={fullUser} lang={lang} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-navy-800">{t("settings.sessions", lang)}</h2>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div className="text-sm min-w-0">
                  <div className="text-slate-700 truncate">{s.userAgent ?? "—"}</div>
                  <div className="text-xs text-slate-500">
                    {s.ipAddress ?? "—"} · {s.lastUsedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </div>
                </div>
                <EndSessionButton sessionId={s.id} lang={lang} />
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <h2 className="font-semibold text-red-700">{t("settings.danger", lang)}</h2>
        </CardHeader>
        <CardBody>
          <Button variant="danger" disabled>
            {t("settings.danger.delete", lang)}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
