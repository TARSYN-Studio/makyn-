import Link from "next/link";
import { LogOut, Building2, MessageSquare, Settings, Globe } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { t, type Lang } from "@/lib/i18n";

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
    { href: "/companies", label: t("nav.companies", lang), Icon: Building2 },
    { href: "/channels", label: t("nav.channels", lang), Icon: MessageSquare },
    { href: "/settings", label: t("nav.settings", lang), Icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex flex-col w-64 border-e border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100">
          <div className="h-9 w-9 rounded-lg bg-navy-500 text-white grid place-items-center font-bold">م</div>
          <div className="flex flex-col">
            <span className="font-semibold text-navy-800">{t("brand.name", lang)}</span>
            <span className="text-xs text-slate-500">{t("brand.tagline", lang)}</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, Icon }) => {
            const active = activePath === href || activePath.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-navy-50 text-navy-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-navy-100 text-navy-700 grid place-items-center text-xs font-semibold">
              {userName.slice(0, 1)}
            </div>
            <span className="truncate text-slate-700">{userName}</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logout", lang)}</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-navy-500 text-white grid place-items-center text-sm font-bold">م</div>
            <span className="font-semibold text-navy-800">{t("brand.name", lang)}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
            <Globe className="h-4 w-4" />
            <span>{lang === "ar" ? "العربية" : "English"}</span>
          </div>
          <form action={logoutAction} className="md:hidden">
            <button type="submit" className="text-sm text-slate-600">
              {t("nav.logout", lang)}
            </button>
          </form>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
