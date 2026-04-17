"use client";

import Link from "next/link";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";

import { logoutAction } from "@/actions/auth";
import type { Lang } from "@/lib/i18n";

type NavItem = { href: string; label: string };

export function MobileNavDrawer({
  lang,
  activePath,
  nav,
  logoutLabel
}: {
  lang: Lang;
  activePath: string;
  nav: NavItem[];
  logoutLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -me-2 text-[var(--text-mid)]"
      >
        <List className="h-5 w-5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        >
          <aside
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="absolute top-0 bottom-0 inset-inline-end-0 w-72 bg-[var(--card)] border-s border-[var(--border)] p-4 shadow-modal"
            style={{ insetInlineEnd: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                {lang === "ar" ? "القائمة" : "Menu"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-2 text-[var(--text-mid)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map(({ href, label }) => {
                const active =
                  activePath === href || activePath.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2 rounded-lg text-[14px] font-medium ${
                      active
                        ? "bg-[var(--accent-l)] text-[var(--accent)]"
                        : "text-[var(--text-mid)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full text-start px-3 py-2 rounded-lg text-[14px] text-[var(--text-mid)] hover:bg-[var(--surface)]"
                >
                  {logoutLabel}
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
