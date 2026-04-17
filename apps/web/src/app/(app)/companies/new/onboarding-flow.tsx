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
    quiz: isAr ? "معلومات النشاط" : "Business Profile",
    upload: isAr ? "رفع المستندات" : "Upload Documents",
    review: isAr ? "المراجعة والتأكيد" : "Review & Confirm"
  };

  const stageOrder: Stage[] = ["quiz", "upload", "review"];
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="min-h-[60vh]">
      {/* Step indicator */}
      <nav className="mb-8 flex items-center gap-2">
        {stageOrder.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentIndex
                  ? "bg-green-500 text-white"
                  : i === currentIndex
                    ? "bg-navy-700 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm ${
                i === currentIndex ? "font-semibold text-navy-800" : "text-gray-400"
              }`}
            >
              {STAGE_LABELS[s]}
            </span>
            {i < stageOrder.length - 1 && (
              <div className={`h-px w-8 ${i < currentIndex ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </nav>

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
            router.push(`/companies/${companyId}`);
          }}
          onBack={() => setStage("upload")}
        />
      )}
    </div>
  );
}
