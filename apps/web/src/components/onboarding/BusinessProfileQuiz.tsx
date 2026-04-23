"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { PressableButton } from "@/components/motion/PressableButton";
import type { Lang } from "@/lib/i18n";

export type BusinessProfile = {
  hasEmployees: boolean;
  hasPremises: boolean;
  activities: string[];
  foreignOwnership: boolean;
};

const ACTIVITY_OPTIONS = [
  { value: "trading", ar: "تجارة عامة", en: "General trading" },
  { value: "services", ar: "خدمات", en: "Services" },
  { value: "manufacturing", ar: "صناعة", en: "Manufacturing" },
  { value: "technology", ar: "تقنية", en: "Technology" },
  { value: "food", ar: "غذاء ومشروبات", en: "Food & beverage" },
  { value: "healthcare", ar: "صحة", en: "Healthcare" },
  { value: "tourism", ar: "سياحة", en: "Tourism" },
  { value: "financial", ar: "مالية", en: "Financial services" },
  { value: "import_export", ar: "استيراد وتصدير", en: "Import & export" },
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
    <div className="max-w-[640px] mx-auto">
      <div className="text-[10.5px] font-mono text-[var(--ink-40)] tracking-[0.2em] uppercase mb-3">
        {isAr ? "الخطوة ١ من ٣" : "Step 1 of 3"}
      </div>
      <h1
        className={`text-[40px] md:text-[48px] font-semibold text-[var(--ink)] leading-[1.05] tracking-[-0.02em] ${
          isAr ? "text-ar" : ""
        }`}
      >
        {isAr ? "بعض الأسئلة السريعة." : "A few quick questions."}
      </h1>
      <p
        className={`text-[15.5px] text-[var(--ink-60)] mt-2 max-w-[480px] ${
          isAr ? "text-ar" : ""
        }`}
      >
        {isAr
          ? "لنعرف المستندات الصحيحة لشركتك."
          : "So we can show you the right document slots."}
      </p>

      <div className="mt-12 space-y-10">
        <Question
          number="01"
          label={isAr ? "هل لديك موظفون؟" : "Do you have employees?"}
          isAr={isAr}
        >
          <YesNo value={hasEmployees} onChange={setHasEmployees} isAr={isAr} />
        </Question>

        <Question
          number="02"
          label={isAr ? "هل لديك موقع فعلي أو مقر؟" : "Do you have physical premises?"}
          isAr={isAr}
        >
          <YesNo value={hasPremises} onChange={setHasPremises} isAr={isAr} />
        </Question>

        <Question
          number="03"
          label={isAr ? "نشاط الشركة الرئيسي" : "Primary business activities"}
          hint={isAr ? "اختر كل ما ينطبق." : "Select all that apply."}
          isAr={isAr}
        >
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const active = activities.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleActivity(opt.value)}
                  className={`px-4 h-10 rounded-full border text-[13px] transition-colors ${
                    active
                      ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
                      : "bg-[var(--card)] text-[var(--ink-80)] border-[var(--stone-light)] hover:border-[var(--ink-40)]"
                  } ${isAr ? "text-ar" : ""}`}
                >
                  {isAr ? opt.ar : opt.en}
                </button>
              );
            })}
          </div>
        </Question>

        <Question
          number="04"
          label={
            isAr
              ? "هل الشركة ذات ملكية أجنبية كاملة أو جزئية؟"
              : "Does the company have foreign ownership?"
          }
          isAr={isAr}
        >
          <YesNo value={foreignOwnership} onChange={setForeignOwnership} isAr={isAr} />
        </Question>
      </div>

      <div className="mt-12 flex items-center justify-end">
        <PressableButton
          size="lg"
          variant="primary"
          disabled={!canContinue}
          onClick={handleContinue}
          trailing={<ArrowRight className="h-4 w-4 flip-rtl" strokeWidth={1.5} />}
        >
          {isAr ? "التالي — رفع المستندات" : "Next — Upload documents"}
        </PressableButton>
      </div>
    </div>
  );
}

function Question({
  number,
  label,
  hint,
  isAr,
  children
}: {
  number: string;
  label: string;
  hint?: string;
  isAr: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[48px_1fr] gap-5">
      <div className="text-[13px] font-mono text-[var(--ink-40)] tracking-wider pt-1 num">
        {number}
      </div>
      <div>
        <div className="flex items-baseline gap-2 flex-wrap mb-4">
          <h2
            className={`text-[18px] font-semibold text-[var(--ink)] ${
              isAr ? "text-ar" : ""
            }`}
          >
            {label}
          </h2>
          {hint && (
            <span
              className={`text-[12.5px] text-[var(--ink-40)] ${
                isAr ? "text-ar" : ""
              }`}
            >
              {hint}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function YesNo({
  value,
  onChange,
  isAr
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  isAr: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <PillButton active={value === true} onClick={() => onChange(true)} isAr={isAr}>
        {isAr ? "نعم" : "Yes"}
      </PillButton>
      <PillButton active={value === false} onClick={() => onChange(false)} isAr={isAr}>
        {isAr ? "لا" : "No"}
      </PillButton>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  isAr,
  children
}: {
  active: boolean;
  onClick: () => void;
  isAr: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[88px] h-11 px-6 rounded-full border text-[14px] font-medium transition-all ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]"
          : "bg-[var(--card)] text-[var(--ink-80)] border-[var(--stone-light)] hover:border-[var(--ink-40)] hover:bg-[var(--card-warm)]"
      } ${isAr ? "text-ar" : ""}`}
    >
      {children}
    </button>
  );
}
