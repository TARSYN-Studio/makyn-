"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

export type BusinessProfile = {
  hasEmployees: boolean;
  hasPremises: boolean;
  activities: string[];
  foreignOwnership: boolean;
};

const ACTIVITY_OPTIONS = [
  { value: "trading", ar: "تجارة عامة", en: "General Trading" },
  { value: "services", ar: "خدمات", en: "Services" },
  { value: "manufacturing", ar: "صناعة", en: "Manufacturing" },
  { value: "technology", ar: "تقنية", en: "Technology" },
  { value: "food", ar: "غذاء ومشروبات", en: "Food & Beverage" },
  { value: "healthcare", ar: "صحة", en: "Healthcare" },
  { value: "tourism", ar: "سياحة", en: "Tourism" },
  { value: "financial", ar: "مالية", en: "Financial Services" },
  { value: "import_export", ar: "استيراد وتصدير", en: "Import & Export" },
  { value: "other", ar: "أخرى", en: "Other" }
];

type Props = {
  lang: Lang;
  onComplete: (profile: BusinessProfile) => void;
};

export function BusinessProfileQuiz({ lang, onComplete }: Props) {
  const isAr = lang === "ar";
  const [hasEmployees, setHasEmployees] = useState<boolean | null>(null);
  const [hasPremises, setHasPremises] = useState<boolean | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [foreignOwnership, setForeignOwnership] = useState<boolean | null>(null);

  function toggleActivity(val: string) {
    setActivities((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );
  }

  const canContinue =
    hasEmployees !== null &&
    hasPremises !== null &&
    activities.length > 0 &&
    foreignOwnership !== null;

  function handleContinue() {
    if (!canContinue) return;
    onComplete({
      hasEmployees: hasEmployees!,
      hasPremises: hasPremises!,
      activities,
      foreignOwnership: foreignOwnership!
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-[20px] font-semibold text-[var(--ink)]">
          {isAr ? "بعض الأسئلة السريعة" : "A few quick questions"}
        </h1>
        <p className="text-[13px] text-[var(--ink-60)] mt-1">
          {isAr
            ? "لنعرف المستندات الصحيحة لشركتك"
            : "So we can show you the right document slots"}
        </p>
      </div>

      {/* Q1 */}
      <div className="space-y-2">
        <p className="font-medium text-[var(--ink)] text-[13px]">
          {isAr ? "هل لديك موظفون؟" : "Do you have employees?"}
        </p>
        <div className="flex gap-3">
          <ToggleBtn
            active={hasEmployees === true}
            onClick={() => setHasEmployees(true)}
            label={isAr ? "نعم" : "Yes"}
          />
          <ToggleBtn
            active={hasEmployees === false}
            onClick={() => setHasEmployees(false)}
            label={isAr ? "لا" : "No"}
          />
        </div>
      </div>

      {/* Q2 */}
      <div className="space-y-2">
        <p className="font-medium text-[var(--ink)] text-[13px]">
          {isAr ? "هل لديك موقع فعلي أو مقر؟" : "Do you have physical premises?"}
        </p>
        <div className="flex gap-3">
          <ToggleBtn
            active={hasPremises === true}
            onClick={() => setHasPremises(true)}
            label={isAr ? "نعم" : "Yes"}
          />
          <ToggleBtn
            active={hasPremises === false}
            onClick={() => setHasPremises(false)}
            label={isAr ? "لا" : "No"}
          />
        </div>
      </div>

      {/* Q3 */}
      <div className="space-y-2">
        <p className="font-medium text-[var(--ink)] text-[13px]">
          {isAr ? "ما نشاط شركتك الرئيسي؟" : "What's your primary business activity?"}
          <span className="text-[var(--ink-40)] font-normal ms-1 text-[11px]">
            {isAr ? "(اختر كل ما ينطبق)" : "(select all that apply)"}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activities.includes(opt.value)}
                onChange={() => toggleActivity(opt.value)}
                className="w-4 h-4 rounded accent-[var(--signal)]"
              />
              <span className="text-[13px] text-[var(--ink)]">
                {isAr ? opt.ar : opt.en}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Q4 */}
      <div className="space-y-2">
        <p className="font-medium text-[var(--ink)] text-[13px]">
          {isAr
            ? "هل الشركة ذات ملكية أجنبية كاملة أو جزئية؟"
            : "Does the company have foreign ownership?"}
        </p>
        <div className="flex gap-3">
          <ToggleBtn
            active={foreignOwnership === true}
            onClick={() => setForeignOwnership(true)}
            label={isAr ? "نعم" : "Yes"}
          />
          <ToggleBtn
            active={foreignOwnership === false}
            onClick={() => setForeignOwnership(false)}
            label={isAr ? "لا" : "No"}
          />
        </div>
      </div>

      <Button
        disabled={!canContinue}
        onClick={handleContinue}
        size="lg"
        className="w-full"
      >
        {isAr ? "التالي — رفع المستندات" : "Next — Upload documents"}
      </Button>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
        active
          ? "bg-[var(--signal)] text-white border-[var(--signal)]"
          : "bg-[var(--paper-low)] text-[var(--ink)] border-[var(--stone-light)] hover:border-[var(--stone)]"
      }`}
    >
      {label}
    </button>
  );
}
