import { Languages, Sun, Moon, PanelLeft, PanelTop } from "lucide-react";

import { prisma } from "@makyn/db";

import { ProfileForm } from "./profile-form";
import { EndSessionButton } from "./end-session";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChoiceRow } from "@/components/motion/ChoiceRow";
import { SettingsSection } from "@/components/motion/SettingsSection";
import { setLanguageAction, setThemeAction, setDockAction } from "@/actions/settings";
import { t, type Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const theme = user.theme === "dark" ? "dark" : "light";
  const dockPosition = user.dockPosition === "top" ? "top" : "side";
  const isAr = lang === "ar";

  const [fullUser, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        preferredLanguage: true
      }
    }),
    prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        createdAt: true
      }
    })
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
          {isAr ? "الإعدادات" : "Settings"}
        </div>
        <h1
          className={`text-[32px] font-semibold text-[var(--ink)] tracking-[-0.02em] ${
            isAr ? "text-ar" : ""
          }`}
        >
          {t("settings.title", lang)}
        </h1>
        <p
          className={`font-display-it text-[17px] text-[var(--ink-60)] mt-2 ${
            isAr ? "text-ar" : ""
          }`}
        >
          {isAr
            ? "كيف يبدو مكين، وكيف يُخاطبك."
            : "How MAKYN looks, and how it speaks to you."}
        </p>
      </div>

      <SettingsSection
        lang={lang}
        eyebrow={isAr ? "المظهر" : "Appearance"}
        title={isAr ? "كيف يبدو مكين" : "How MAKYN appears"}
        sub={
          isAr
            ? "اللغة، النمط اللوني، وموقع شريط التنقل."
            : "Language, theme, and dock position."
        }
      >
        <ChoiceRow
          lang={lang}
          label={isAr ? "اللغة" : "Language"}
          sub={isAr ? "لغة الواجهة بالكامل" : "Interface language"}
          value={lang}
          fieldName="lang"
          action={setLanguageAction}
          options={[
            {
              value: "en",
              label: "English",
              icon: <Languages className="h-3.5 w-3.5" strokeWidth={1.5} />
            },
            {
              value: "ar",
              label: "العربية",
              icon: <Languages className="h-3.5 w-3.5" strokeWidth={1.5} />
            }
          ]}
        />
        <ChoiceRow
          lang={lang}
          label={isAr ? "النمط" : "Theme"}
          sub={isAr ? "فاتح أو داكن" : "Light or dark"}
          value={theme}
          fieldName="theme"
          action={setThemeAction}
          options={[
            {
              value: "light",
              label: isAr ? "فاتح" : "Light",
              icon: <Sun className="h-3.5 w-3.5" strokeWidth={1.5} />
            },
            {
              value: "dark",
              label: isAr ? "داكن" : "Dark",
              icon: <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />
            }
          ]}
        />
        <ChoiceRow
          lang={lang}
          label={isAr ? "شريط التنقل" : "Navigation"}
          sub={isAr ? "جانبي أو علوي" : "Side rail or top bar"}
          value={dockPosition}
          fieldName="dockPosition"
          action={setDockAction}
          options={[
            {
              value: "side",
              label: isAr ? "جانبي" : "Side",
              icon: <PanelLeft className="h-3.5 w-3.5 flip-rtl" strokeWidth={1.5} />
            },
            {
              value: "top",
              label: isAr ? "علوي" : "Top",
              icon: <PanelTop className="h-3.5 w-3.5" strokeWidth={1.5} />
            }
          ]}
        />
      </SettingsSection>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--ink)]">{t("settings.profile", lang)}</h2>
        </CardHeader>
        <CardBody>
          <ProfileForm user={fullUser} lang={lang} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--ink)]">{t("settings.sessions", lang)}</h2>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-[var(--stone-light)]">
            {sessions.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div className="text-[13px] min-w-0">
                  <div className="text-[var(--ink)] truncate">{s.userAgent ?? "—"}</div>
                  <div className="text-[12px] text-[var(--ink-40)] num">
                    {s.ipAddress ?? "—"} · {s.lastUsedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </div>
                </div>
                <EndSessionButton sessionId={s.id} lang={lang} />
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card className="border-[rgba(139, 38, 53, 0.2)]">
        <CardHeader>
          <h2 className="font-semibold text-[var(--state-overdue)]">{t("settings.danger", lang)}</h2>
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
