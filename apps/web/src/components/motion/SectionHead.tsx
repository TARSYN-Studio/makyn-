import type { Lang } from "@/lib/i18n";
import { MagneticLink } from "./MagneticLink";

export function SectionHead({
  lang,
  eyebrow,
  title,
  action,
  onAction,
  actionHref
}: {
  lang: Lang;
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  const isAr = lang === "ar";
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.18em] uppercase mb-1.5">
          {eyebrow}
        </div>
        <h2
          className={`text-[22px] font-semibold text-[var(--ink)] tracking-[-0.01em] ${
            isAr ? "text-ar" : ""
          }`}
        >
          {title}
        </h2>
      </div>
      {action && (
        <MagneticLink
          onClick={onAction}
          href={actionHref}
          isRtl={isAr}
          className="text-[12px] text-[var(--ink-60)] hover:text-[var(--ink)]"
        >
          {action} →
        </MagneticLink>
      )}
    </div>
  );
}
