import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  FileText,
  Activity,
  MessageSquare,
  Settings as SettingsIcon
} from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { setLanguageAction } from "@/actions/settings";
import { t, type Lang } from "@/lib/i18n";
import { Wordmark } from "@/components/LogoMark";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import type { LucideIcon } from "lucide-react";

type DockPosition = "side" | "top";

type NavEntry = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const NAV: NavEntry[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/organizations", labelKey: "nav.companies", icon: Building2 },
  { href: "/issues", labelKey: "nav.issues", icon: AlertTriangle },
  { href: "/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/activity", labelKey: "nav.activity", icon: Activity },
  { href: "/channels", labelKey: "nav.channels", icon: MessageSquare },
  { href: "/settings", labelKey: "nav.settings", icon: SettingsIcon }
];

export function AppShell({
  children,
  lang,
  userName,
  activePath,
  dockPosition = "side"
}: {
  children: React.ReactNode;
  lang: Lang;
  userName: string;
  activePath: string;
  dockPosition?: DockPosition;
}) {
  const nav = NAV.map((item) => ({ ...item, label: t(item.labelKey, lang) }));
  const initial = (userName ?? "").trim().slice(0, 1).toUpperCase() || "·";
  const otherLang: Lang = lang === "ar" ? "en" : "ar";

  if (dockPosition === "top") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--paper)]">
        <TopDock
          lang={lang}
          nav={nav}
          activePath={activePath}
          userName={userName}
          initial={initial}
          otherLang={otherLang}
        />
        <main className="flex-1 fade-in">
          <div className="px-4 md:px-8 py-8">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--paper)]">
      <SideDock
        lang={lang}
        nav={nav}
        activePath={activePath}
        userName={userName}
        initial={initial}
        otherLang={otherLang}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar
          lang={lang}
          nav={nav}
          activePath={activePath}
          userName={userName}
          initial={initial}
          otherLang={otherLang}
        />
        <main className="flex-1 fade-in">
          <div className="px-4 md:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

type NavItem = NavEntry & { label: string };

function SideDock({
  lang,
  nav,
  activePath,
  userName,
  initial,
  otherLang
}: {
  lang: Lang;
  nav: NavItem[];
  activePath: string;
  userName: string;
  initial: string;
  otherLang: Lang;
}) {
  const isAr = lang === "ar";
  return (
    <aside
      className="hidden md:flex shrink-0 flex-col sticky top-0 self-start h-screen"
      style={{
        width: "var(--dock-side-width)",
        background: "var(--chrome)",
        borderInlineEnd: "1px solid var(--chrome-line)",
        padding: "22px 18px"
      }}
    >
      <Link
        href="/dashboard"
        className="px-1 mb-6 flex items-center self-start"
        aria-label="MAKYN"
      >
        <Wordmark size="sm" lang={lang} boxWidth={150} />
      </Link>

      <div
        className="text-[10px] font-mono tracking-[0.2em] uppercase text-[var(--ink-40)] mb-2 px-2"
      >
        {isAr ? "التنقل" : "Navigate"}
      </div>
      <nav className="flex-1 space-y-0.5">
        {nav.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            activePath={activePath}
            orientation="side"
            isAr={isAr}
          />
        ))}
      </nav>

      <div
        className="pt-4 mt-4 border-t"
        style={{ borderColor: "var(--chrome-line)" }}
      >
        <p
          className={`font-display-it text-[13px] text-[var(--ink-60)] leading-snug px-2 ${
            isAr ? "text-ar" : ""
          }`}
        >
          {isAr ? "كل مؤسسة تبدأ بملف." : "Every organization begins with a file."}
        </p>
        <div className="flex items-center gap-2.5 mt-4 px-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-semibold text-white flex-none"
            style={{ background: "var(--signal)" }}
            aria-label={userName}
            title={userName}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[12px] font-medium text-[var(--ink)] truncate ${
                isAr ? "text-ar" : ""
              }`}
            >
              {userName}
            </div>
            <div className="text-[10px] font-mono text-[var(--ink-40)] num">
              MAKYN · {new Date().getFullYear()}
            </div>
          </div>
          <form action={setLanguageAction}>
            <input type="hidden" name="lang" value={otherLang} />
            <button
              type="submit"
              aria-label="Change language"
              className="text-[10.5px] font-mono px-1.5 py-1 rounded hover:bg-[var(--chrome-hover)] text-[var(--ink-60)]"
            >
              {otherLang === "ar" ? "ع" : "EN"}
            </button>
          </form>
        </div>
        <form action={logoutAction} className="mt-2 px-2">
          <button
            type="submit"
            className="text-[11px] text-[var(--ink-40)] hover:text-[var(--ink)] w-full text-start"
          >
            {t("nav.logout", lang)}
          </button>
        </form>
      </div>
    </aside>
  );
}

function TopDock({
  lang,
  nav,
  activePath,
  userName,
  initial,
  otherLang
}: {
  lang: Lang;
  nav: NavItem[];
  activePath: string;
  userName: string;
  initial: string;
  otherLang: Lang;
}) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--chrome)",
        borderBottom: "1px solid var(--chrome-line)",
        height: "var(--dock-top-height)"
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex-none" aria-label="MAKYN">
          <Wordmark size="sm" lang={lang} />
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center min-w-0 overflow-x-auto">
          {nav.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              activePath={activePath}
              orientation="top"
              isAr={lang === "ar"}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-none">
          <form action={setLanguageAction} className="hidden md:block">
            <input type="hidden" name="lang" value={otherLang} />
            <button
              type="submit"
              aria-label="Change language"
              className="text-[12px] text-[var(--ink-60)] hover:text-[var(--ink)] px-2 py-1.5 rounded hover:bg-[var(--chrome-hover)]"
            >
              {otherLang === "ar" ? "ع" : "EN"}
            </button>
          </form>
          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="text-[12px] font-medium text-[var(--ink-60)] hover:text-[var(--ink)] px-2 py-1.5"
            >
              {t("nav.logout", lang)}
            </button>
          </form>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10.5px] font-semibold flex-none"
            style={{ background: "var(--signal)" }}
            aria-label={userName}
            title={userName}
          >
            {initial}
          </div>
          <MobileNavDrawer
            lang={lang}
            activePath={activePath}
            nav={nav.map(({ href, label }) => ({ href, label }))}
            logoutLabel={t("nav.logout", lang)}
          />
        </div>
      </div>
    </header>
  );
}

// The side dock hides on mobile; surface a compact top bar instead so
// the drawer trigger and logo stay reachable.
function MobileTopBar({
  lang,
  nav,
  activePath,
  userName,
  initial,
  otherLang
}: {
  lang: Lang;
  nav: NavItem[];
  activePath: string;
  userName: string;
  initial: string;
  otherLang: Lang;
}) {
  return (
    <header
      className="md:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4"
      style={{
        background: "var(--chrome)",
        borderBottom: "1px solid var(--chrome-line)"
      }}
    >
      <Link href="/dashboard" aria-label="MAKYN">
        <Wordmark size="sm" lang={lang} boxWidth={110} />
      </Link>
      <div className="flex items-center gap-2">
        <form action={setLanguageAction}>
          <input type="hidden" name="lang" value={otherLang} />
          <button
            type="submit"
            className="text-[11px] text-[var(--ink-60)] px-1.5 py-1"
            aria-label="Change language"
          >
            {otherLang === "ar" ? "ع" : "EN"}
          </button>
        </form>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10.5px] font-semibold"
          style={{ background: "var(--signal)" }}
          aria-label={userName}
        >
          {initial}
        </div>
        <MobileNavDrawer
          lang={lang}
          activePath={activePath}
          nav={nav.map(({ href, label }) => ({ href, label }))}
          logoutLabel={t("nav.logout", lang)}
        />
      </div>
    </header>
  );
}

function NavRow({
  item,
  activePath,
  orientation,
  isAr
}: {
  item: NavItem;
  activePath: string;
  orientation: "side" | "top";
  isAr: boolean;
}) {
  const active =
    activePath === item.href || activePath.startsWith(`${item.href}/`);
  const Icon = item.icon;
  const vertical = orientation === "side";

  if (vertical) {
    return (
      <Link
        href={item.href}
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] ${
          active
            ? "bg-[var(--ink)] text-[var(--paper)]"
            : "text-[var(--ink-60)] hover:bg-[var(--chrome-hover)] hover:text-[var(--ink)]"
        } ${active ? "font-medium" : ""} ${isAr ? "text-ar" : ""}`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-md text-[13px] ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "text-[var(--ink-60)] hover:bg-[var(--chrome-hover)] hover:text-[var(--ink)]"
      } ${active ? "font-medium" : ""} ${isAr ? "text-ar" : ""}`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      <span>{item.label}</span>
    </Link>
  );
}
