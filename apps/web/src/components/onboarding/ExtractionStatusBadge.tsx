"use client";

import type { Lang } from "@/lib/i18n";

type Status = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";

const LABELS: Record<Status, Record<Lang, string>> = {
  PENDING: { ar: "في الانتظار", en: "Pending" },
  PROCESSING: { ar: "جاري القراءة...", en: "Reading..." },
  COMPLETED: { ar: "تم", en: "Done" },
  FAILED: { ar: "فشل", en: "Failed" },
  PARTIAL: { ar: "جزئي", en: "Partial" }
};

const COLORS: Record<Status, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PROCESSING: "bg-blue-50 text-blue-700 animate-pulse",
  COMPLETED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  PARTIAL: "bg-yellow-50 text-yellow-700"
};

export function ExtractionStatusBadge({ status, lang }: { status: Status; lang: Lang }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${COLORS[status]}`}>
      {status === "PROCESSING" && (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {status === "COMPLETED" && <span>✓</span>}
      {status === "FAILED" && <span>✗</span>}
      {LABELS[status][lang]}
    </span>
  );
}
