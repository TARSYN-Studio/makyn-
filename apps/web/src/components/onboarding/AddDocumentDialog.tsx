"use client";

import { useEffect, useRef, useState } from "react";

import type { Lang } from "@/lib/i18n";

export type DocTypeOption = {
  value: string;
  labelAr: string;
  labelEn: string;
};

export const ALL_DOC_TYPES: DocTypeOption[] = [
  { value: "COMMERCIAL_REGISTRATION", labelAr: "السجل التجاري", labelEn: "Commercial Registration" },
  { value: "ZATCA_VAT_CERTIFICATE", labelAr: "شهادة ضريبة القيمة المضافة ZATCA", labelEn: "ZATCA VAT Certificate" },
  { value: "ZAKAT_ASSESSMENT", labelAr: "ربط زكوي ZATCA", labelEn: "Zakat Assessment" },
  { value: "CHAMBER_OF_COMMERCE", labelAr: "غرفة التجارة", labelEn: "Chamber of Commerce" },
  { value: "GOSI_REGISTRATION", labelAr: "تسجيل التأمينات الاجتماعية GOSI", labelEn: "GOSI Registration" },
  { value: "QIWA_ESTABLISHMENT", labelAr: "شهادة منشأة قوى Qiwa", labelEn: "Qiwa Establishment" },
  { value: "MUDAD_CERTIFICATE", labelAr: "شهادة مدد WPS", labelEn: "Mudad WPS Certificate" },
  { value: "MUQEEM_ACCOUNT", labelAr: "حساب مقيم", labelEn: "Muqeem Account" },
  { value: "BALADY_LICENSE", labelAr: "رخصة بلدي", labelEn: "Balady License" },
  { value: "CIVIL_DEFENSE_CERT", labelAr: "شهادة الدفاع المدني", labelEn: "Civil Defense Certificate" },
  { value: "MINISTRY_OF_INDUSTRY", labelAr: "ترخيص وزارة الصناعة", labelEn: "Ministry of Industry" },
  { value: "MINISTRY_OF_HEALTH", labelAr: "ترخيص وزارة الصحة", labelEn: "Ministry of Health" },
  { value: "MINISTRY_OF_TOURISM", labelAr: "ترخيص وزارة السياحة", labelEn: "Ministry of Tourism" },
  { value: "MINISTRY_OF_JUSTICE", labelAr: "ترخيص وزارة العدل", labelEn: "Ministry of Justice" },
  { value: "MINISTRY_OF_ENVIRONMENT", labelAr: "ترخيص وزارة البيئة", labelEn: "Ministry of Environment" },
  { value: "MINISTRY_OF_CULTURE", labelAr: "ترخيص وزارة الثقافة", labelEn: "Ministry of Culture" },
  { value: "MINISTRY_OF_SPORTS", labelAr: "ترخيص وزارة الرياضة", labelEn: "Ministry of Sports" },
  { value: "SFDA_LICENSE", labelAr: "ترخيص هيئة الغذاء والدواء SFDA", labelEn: "SFDA License" },
  { value: "SASO_CERTIFICATE", labelAr: "شهادة هيئة المواصفات SASO", labelEn: "SASO Certificate" },
  { value: "CST_LICENSE", labelAr: "ترخيص هيئة الاتصالات CST", labelEn: "CST License" },
  { value: "SAMA_LICENSE", labelAr: "ترخيص البنك المركزي SAMA", labelEn: "SAMA License" },
  { value: "CMA_LICENSE", labelAr: "ترخيص هيئة السوق المالية CMA", labelEn: "CMA License" },
  { value: "MISA_INVESTMENT_LICENSE", labelAr: "ترخيص وزارة الاستثمار MISA", labelEn: "MISA Investment License" },
  { value: "MONSHAAT_REGISTRATION", labelAr: "تسجيل منشآت", labelEn: "Monsha'at Registration" },
  { value: "SOCPA_MEMBERSHIP", labelAr: "عضوية هيئة المحاسبين SOCPA", labelEn: "SOCPA Membership" },
  { value: "SCE_MEMBERSHIP", labelAr: "عضوية هيئة المهندسين SCE", labelEn: "SCE Membership" },
  { value: "MHRSD_NITAQAT", labelAr: "شهادة نطاقات MHRSD", labelEn: "MHRSD Nitaqat" },
  { value: "OTHER", labelAr: "أخرى / Other", labelEn: "Other" }
];

type Props = {
  open: boolean;
  lang: Lang;
  existingTypes: Set<string>;
  onSelect: (docType: DocTypeOption) => void;
  onClose: () => void;
};

export function AddDocumentDialog({ open, lang, existingTypes, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === "ar";

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const filtered = ALL_DOC_TYPES.filter((t) => {
    if (existingTypes.has(t.value)) return false;
    if (!q) return true;
    return (
      t.labelAr.includes(query) ||
      t.labelEn.toLowerCase().includes(q) ||
      t.value.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--card)] rounded-lg shadow-modal w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text)] text-[14px]">
            {isAr ? "ما نوع المستند الذي تريد إضافته؟" : "Which document type?"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--text)] text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-3 border-b border-[var(--border)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? "ابحث عن نوع المستند..." : "Search document type..."}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[rgba(30,58,138,0.15)] focus:border-[var(--accent)]"
            dir={isAr ? "rtl" : "ltr"}
          />
        </div>

        <ul className="overflow-y-auto flex-1 py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-[13px] text-[var(--text-dim)] text-center">
              {isAr ? "لا توجد نتائج" : "No results"}
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  className="w-full text-start px-4 py-2.5 text-[13px] hover:bg-[var(--accent-xl)] transition-colors"
                >
                  <span className="font-medium text-[var(--text)]">
                    {isAr ? opt.labelAr : opt.labelEn}
                  </span>
                  {isAr && (
                    <span className="block text-[11px] text-[var(--text-dim)]">{opt.labelEn}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
