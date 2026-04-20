"use client";

import type { Lang } from "@/lib/i18n";

export function ConfidenceIndicator({ confidence, lang }: { confidence: number; lang: Lang }) {
  if (confidence >= 0.7) return null;
  const msg =
    lang === "ar"
      ? "دقة الاستخراج منخفضة — تحقق من هذا الحقل"
      : "Low extraction confidence — please verify";
  return (
    <span title={msg} className="text-[var(--state-pending)] text-xs ms-1 cursor-help" aria-label={msg}>
      ⚠
    </span>
  );
}
