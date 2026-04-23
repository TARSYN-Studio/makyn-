"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  const isRtl = lang === "ar";
  // Slide from the "end" edge — right in LTR, left in RTL.
  const slideFrom = isRtl ? -320 : 320;

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -me-2 text-[var(--ink-60)]"
      >
        <Menu className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: "rgba(14, 22, 40, 0.4)" }}
          >
            <motion.aside
              dir={isRtl ? "rtl" : "ltr"}
              className="absolute top-0 bottom-0 w-72 bg-[var(--chrome)] border-s border-[var(--chrome-line)] p-4 shadow-modal"
              style={{ insetInlineEnd: 0 }}
              onClick={(e) => e.stopPropagation()}
              initial={{ x: slideFrom }}
              animate={{ x: 0 }}
              exit={{ x: slideFrom }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] uppercase tracking-wider text-[var(--ink-40)]">
                  {lang === "ar" ? "القائمة" : "Menu"}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="p-2 text-[var(--ink-60)]"
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
                          ? "bg-[var(--ink)] text-[var(--paper)]"
                          : "text-[var(--ink-60)] hover:bg-[var(--chrome-hover)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 pt-6 border-t border-[var(--chrome-line)]">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full text-start px-3 py-2 rounded-lg text-[14px] text-[var(--ink-60)] hover:bg-[var(--chrome-hover)]"
                  >
                    {logoutLabel}
                  </button>
                </form>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
