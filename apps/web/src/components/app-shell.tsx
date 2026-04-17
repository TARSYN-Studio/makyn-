import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { setLanguageAction } from "@/actions/settings";
import { t, type Lang } from "@/lib/i18n";
import { Wordmark } from "@/components/LogoMark";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";

export function AppShell({
  children,
  lang,
  userName,
  activePath
}: {
  children: React.ReactNode;
  lang: Lang;
  userName: string;
  activePath: string;
}) {
  const nav = [
    { href: "/dashboard", label: t("nav.dashboard", lang) },
    { href: "/companies", label: t("nav.companies", lang) },
    { href: "/channels", label: t("nav.channels", lang) },
    { href: "/settings", label: t("nav.settings", lang) }
  ];

  const initial = (userName ?? "").trim().slice(0, 1).toUpperCase() || "·";
  const otherLang: Lang = lang === "ar" ? "en" : "ar";

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <header className="h-14 bg-[var(--card)] border-b border-[var(--border)] flex items-center px-4 md:px-6">
        {/* Left: logo + wordmark */}
        <Link href="/dashboard" className="flex items-center me-6 shrink-0">
          <Wordmark size="sm" />
        </Link>

        {/* Center: desktop nav */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          {nav.map(({ href, label }) => {
            const active = activePath === href || activePath.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`relative h-full flex items-center px-3 text-[13px] font-medium transition-colors ${
                  active
                    ? "text-[var(--text)]"
                    : "text-[var(--text-mid)] hover:text-[var(--text)]"
                }`}
              >
                {label}
                {active && (
                  <span
                    className="absolute left-0 right-0 bottom-0 h-[2px] bg-[var(--accent)]"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: language toggle + avatar + logout */}
        <div className="ms-auto flex items-center gap-3">
          <form action={setLanguageAction} className="hidden md:block">
            <input type="hidden" name="lang" value={otherLang} />
            <button
              type="submit"
              className="text-[12px] font-medium text-[var(--text-mid)] hover:text-[var(--text)]"
              aria-label="Change language"
            >
              {otherLang === "ar" ? "العربية" : "EN"}
            </button>
          </form>
          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="text-[12px] font-medium text-[var(--text-mid)] hover:text-[var(--text)]"
            >
              {t("nav.logout", lang)}
            </button>
          </form>
          <div
            className="h-8 w-8 rounded-full bg-[var(--accent)] text-white grid place-items-center text-[13px] font-semibold"
            aria-label={userName}
            title={userName}
          >
            {initial}
          </div>
          <MobileNavDrawer
            lang={lang}
            activePath={activePath}
            nav={nav}
            logoutLabel={t("nav.logout", lang)}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 px-4 md:px-6 py-6 fade-in">{children}</div>
      </main>
    </div>
  );
}
