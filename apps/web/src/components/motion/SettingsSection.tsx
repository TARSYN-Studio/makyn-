import type { ReactNode } from "react";

import type { Lang } from "@/lib/i18n";

export function SettingsSection({
  lang,
  eyebrow,
  title,
  sub,
  children
}: {
  lang: Lang;
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  const isAr = lang === "ar";
  return (
    <section>
      <div className="mb-4">
        <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-1.5">
          {eyebrow}
        </div>
        <h2
          className={`text-[20px] font-semibold text-[var(--ink)] tracking-[-0.01em] ${
            isAr ? "text-ar" : ""
          }`}
        >
          {title}
        </h2>
        {sub && (
          <p
            className={`text-[13px] text-[var(--ink-60)] mt-1 ${
              isAr ? "text-ar" : ""
            }`}
          >
            {sub}
          </p>
        )}
      </div>
      <div className="rounded-xl bg-[var(--card)] border border-[var(--stone-hair)] elev-1 divide-y divide-[var(--stone-hair)]">
        {children}
      </div>
    </section>
  );
}
