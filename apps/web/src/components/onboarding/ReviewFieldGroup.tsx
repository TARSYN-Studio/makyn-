"use client";

import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type { Lang } from "@/lib/i18n";

export type ReviewField = {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
  confidence?: number;
  source?: string;
};

type Props = {
  titleAr: string;
  titleEn: string;
  fields: ReviewField[];
  lang: Lang;
  onChange: (key: string, value: string) => void;
};

export function ReviewFieldGroup({ titleAr, titleEn, fields, lang, onChange }: Props) {
  const isAr = lang === "ar";
  if (fields.length === 0) return null;

  return (
    <fieldset className="border border-[var(--stone-light)] rounded-lg overflow-hidden">
      <legend className="px-4 py-2 bg-[var(--signal-tint)] w-full text-start font-semibold text-[var(--ink)] text-[13px] border-b border-[var(--stone-light)]">
        {isAr ? titleAr : titleEn}
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 p-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-[11px] font-medium text-[var(--ink-60)] mb-0.5">
              {isAr ? f.labelAr : f.labelEn}
              {f.confidence !== undefined && (
                <ConfidenceIndicator confidence={f.confidence} lang={lang} />
              )}
              {f.source && (
                <span className="ms-1 text-[var(--ink-40)] font-normal">
                  ({isAr ? "من" : "from"} {f.source})
                </span>
              )}
            </label>
            <input
              type="text"
              value={f.value}
              onChange={(e) => onChange(f.key, e.target.value)}
              dir={isAr ? "rtl" : "ltr"}
              className="w-full border border-[var(--stone-light)] rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[rgba(30,58,138,0.15)] focus:border-[var(--signal)] bg-[var(--paper-low)]"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
