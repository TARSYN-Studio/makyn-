import { Languages, Sun, Moon, PanelLeft, PanelTop } from "lucide-react";

import { prisma } from "@makyn/db";

import { ProfileForm } from "./profile-form";
import { EndSessionButton } from "./end-session";
import { Button } from "@/components/ui/button";
import { ChoiceRow } from "@/components/motion/ChoiceRow";
import { Reveal } from "@/components/motion/Reveal";
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
    <div className="max-w-3xl mx-auto space-y-12">
      <Reveal>
        <div>
          <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-2">
            {isAr ? "الإعدادات · كيف يعمل مكين من أجلك" : "Settings · How MAKYN works for you"}
          </div>
          <h1
            className={`text-[40px] md:text-[48px] font-semibold text-[var(--ink)] tracking-[-0.02em] leading-[1.05] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {t("settings.title", lang)}
          </h1>
          <p
            className={`font-display-it text-[18px] text-[var(--ink-60)] mt-3 max-w-[540px] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {isAr
              ? "كيف تراه، وكيف يصل إليك، ومن يمكنه التصرف بجانبك."
              : "Shape what you see, how we reach you, and who can act with you."}
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <SettingsSection
          lang={lang}
          eyebrow={isAr ? "المظهر" : "Appearance"}
          title={isAr ? "الشكل والقراءة" : "How it looks and reads"}
          sub={
            isAr
              ? "اللغة، النمط اللوني، وموقع شريط التنقل."
              : "Language, theme, and dock position."
          }
        >
          <ChoiceRow
            lang={lang}
            label={isAr ? "اللغة" : "Language"}
            sub={
              isAr
                ? "لغة الواجهة واتجاه القراءة"
                : "Interface language and reading direction"
            }
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
            sub={
              isAr
                ? "فاتح للنهار، داكن للمساء"
                : "Light for daytime, dark for evenings"
            }
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
            sub={
              isAr
                ? "الجانبي يمنح مساحة أكبر؛ العلوي أكثر اختصاراً"
                : "Side gives more room; top is more compact"
            }
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
      </Reveal>

      <Reveal delay={140}>
        <SettingsSection
          lang={lang}
          eyebrow={isAr ? "الحساب" : "Account"}
          title={t("settings.profile", lang)}
          sub={isAr ? "معلوماتك الشخصية." : "Your personal details."}
        >
          <div className="px-5 py-5">
            <ProfileForm user={fullUser} lang={lang} />
          </div>
        </SettingsSection>
      </Reveal>

      <Reveal delay={200}>
        <SettingsSection
          lang={lang}
          eyebrow={isAr ? "الجلسات" : "Sessions"}
          title={t("settings.sessions", lang)}
          sub={
            isAr
              ? "الأجهزة المتصلة بحسابك. أنهِ أياً منها إذا لزم."
              : "Devices signed into your account. End any you don't recognise."
          }
        >
          {sessions.length === 0 ? (
            <div className="px-5 py-6 text-[13px] text-[var(--ink-40)]">—</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="text-[13px] min-w-0">
                  <div className="text-[var(--ink)] truncate">{s.userAgent ?? "—"}</div>
                  <div className="text-[12px] text-[var(--ink-40)] num">
                    {s.ipAddress ?? "—"} · {s.lastUsedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </div>
                </div>
                <EndSessionButton sessionId={s.id} lang={lang} />
              </div>
            ))
          )}
        </SettingsSection>
      </Reveal>

      <Reveal delay={260}>
        <SettingsSection
          lang={lang}
          eyebrow={isAr ? "منطقة الحذف" : "Danger zone"}
          title={t("settings.danger", lang)}
          sub={
            isAr
              ? "إجراءات لا رجعة فيها."
              : "Irreversible actions."
          }
        >
          <div className="px-5 py-5">
            <Button variant="danger" disabled>
              {t("settings.danger.delete", lang)}
            </Button>
          </div>
        </SettingsSection>
      </Reveal>
    </div>
  );
}
