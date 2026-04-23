"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BusinessProfileQuiz, type BusinessProfile } from "@/components/onboarding/BusinessProfileQuiz";
import { DocumentUploadGrid } from "@/components/onboarding/DocumentUploadGrid";
import { ReviewForm } from "@/components/onboarding/ReviewForm";
import type { Lang } from "@/lib/i18n";

type Stage = "quiz" | "upload" | "review";

type UploadedDoc = {
  documentId: string;
  fileName: string;
  docType: string;
};

type ExtractedResult = {
  id: string;
  docType: string;
  extractionStatus: string;
  extractedData: unknown;
  extractionConfidence: number | null;
};

// Stable session ID for this onboarding flow (survives re-renders)
function makeSessionId() {
  return `onboard_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function OnboardingFlow({ lang }: { lang: Lang }) {
  const router = useRouter();
  const isAr = lang === "ar";
  const [sessionId] = useState(makeSessionId);
  const [stage, setStage] = useState<Stage>("quiz");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [extractedResults, setExtractedResults] = useState<ExtractedResult[]>([]);

  const STAGE_LABELS = {
    quiz: isAr ? "معلومات النشاط" : "Business profile",
    upload: isAr ? "رفع المستندات" : "Upload documents",
    review: isAr ? "المراجعة والتأكيد" : "Review & confirm"
  };

  const stageOrder: Stage[] = ["quiz", "upload", "review"];
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Editorial eyebrow */}
      <div className="pt-2 pb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-40)]">
          <span>{isAr ? "الشركات" : "Organizations"}</span>
          <span>/</span>
          <span className="text-[var(--ink-60)]">
            {isAr ? "إضافة شركة" : "Add organization"}
          </span>
        </div>
        <Stepper labels={STAGE_LABELS} stages={stageOrder} current={currentIndex} isAr={isAr} />
      </div>

      {/* Editorial subline — Fraunces italic */}
      <p
        className={`font-display-it text-[22px] md:text-[26px] text-[var(--ink-60)] leading-snug mb-10 ${
          isAr ? "text-ar" : ""
        }`}
      >
        {isAr ? "كل شركة تبدأ بملف." : "Every organization begins with a file."}
      </p>

      {stage === "quiz" && (
        <BusinessProfileQuiz
          lang={lang}
          onComplete={(p) => {
            setProfile(p);
            setStage("upload");
          }}
        />
      )}

      {stage === "upload" && profile && (
        <DocumentUploadGrid
          lang={lang}
          sessionId={sessionId}
          profile={profile}
          onComplete={(docs, results) => {
            setUploadedDocs(docs);
            setExtractedResults(results);
            setStage("review");
          }}
          onBack={() => setStage("quiz")}
        />
      )}

      {stage === "review" && (
        <ReviewForm
          lang={lang}
          sessionId={sessionId}
          uploadedDocs={uploadedDocs}
          results={extractedResults}
          onSaved={(companyId) => {
            router.push(`/organizations/${companyId}`);
          }}
          onBack={() => setStage("upload")}
        />
      )}
    </div>
  );
}

function Stepper({
  labels,
  stages,
  current,
  isAr
}: {
  labels: Record<Stage, string>;
  stages: Stage[];
  current: number;
  isAr: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {stages.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono num transition-colors ${
                done
                  ? "bg-[var(--state-resolved)] text-white"
                  : active
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-[var(--card)] text-[var(--ink-40)] border border-[var(--stone-light)]"
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={`text-[12.5px] ${
                active
                  ? "font-semibold text-[var(--ink)]"
                  : done
                    ? "text-[var(--ink-60)]"
                    : "text-[var(--ink-40)]"
              } ${isAr ? "text-ar" : ""}`}
            >
              {labels[s]}
            </span>
            {i < stages.length - 1 && (
              <div
                className={`h-px w-6 ${
                  done ? "bg-[var(--state-resolved)]" : "bg-[var(--stone-light)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
