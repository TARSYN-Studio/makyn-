"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AddDocumentDialog, ALL_DOC_TYPES, type DocTypeOption } from "./AddDocumentDialog";
import { DocumentUploadCard, type DocStatus } from "./DocumentUploadCard";
import type { BusinessProfile } from "./BusinessProfileQuiz";
import type { Lang } from "@/lib/i18n";

// Metadata for every document type
const DOC_META: Record<string, { nameAr: string; nameEn: string; descriptionAr: string }> = {
  COMMERCIAL_REGISTRATION: {
    nameAr: "السجل التجاري",
    nameEn: "Commercial Registration",
    descriptionAr: "الوثيقة الأساسية لنشاطك التجاري الصادرة من وزارة التجارة"
  },
  ZATCA_VAT_CERTIFICATE: {
    nameAr: "شهادة تسجيل ضريبة القيمة المضافة",
    nameEn: "VAT Certificate",
    descriptionAr: "شهادة تسجيل ضريبة القيمة المضافة من هيئة الزكاة والضريبة"
  },
  ZAKAT_ASSESSMENT: {
    nameAr: "الربط الزكوي",
    nameEn: "Zakat Assessment",
    descriptionAr: "إشعار التقييم الزكوي السنوي من هيئة الزكاة"
  },
  CHAMBER_OF_COMMERCE: {
    nameAr: "عضوية غرفة التجارة",
    nameEn: "Chamber of Commerce",
    descriptionAr: "شهادة عضوية الغرفة التجارية الإقليمية"
  },
  GOSI_REGISTRATION: {
    nameAr: "تسجيل التأمينات الاجتماعية",
    nameEn: "GOSI Registration",
    descriptionAr: "شهادة تسجيل صاحب العمل في المؤسسة العامة للتأمينات الاجتماعية"
  },
  QIWA_ESTABLISHMENT: {
    nameAr: "شهادة المنشأة من قوى",
    nameEn: "Qiwa Establishment",
    descriptionAr: "شهادة المنشأة من منصة قوى تشمل نسبة التوطين"
  },
  MUDAD_CERTIFICATE: {
    nameAr: "شهادة مدد (حماية الأجور)",
    nameEn: "Mudad WPS Certificate",
    descriptionAr: "شهادة الامتثال لنظام حماية الأجور عبر منصة مدد"
  },
  MUQEEM_ACCOUNT: {
    nameAr: "حساب مقيم",
    nameEn: "Muqeem Account",
    descriptionAr: "وثيقة حساب مقيم لإدارة خدمات المقيمين والعمالة"
  },
  BALADY_LICENSE: {
    nameAr: "الرخصة البلدية",
    nameEn: "Balady License",
    descriptionAr: "رخصة النشاط التجاري الصادرة من البلدية عبر منصة بلدي"
  },
  CIVIL_DEFENSE_CERT: {
    nameAr: "شهادة الدفاع المدني",
    nameEn: "Civil Defense Certificate",
    descriptionAr: "شهادة السلامة والحماية من الحريق"
  },
  MINISTRY_OF_INDUSTRY: {
    nameAr: "ترخيص وزارة الصناعة",
    nameEn: "Ministry of Industry License",
    descriptionAr: "الترخيص الصناعي الصادر من وزارة الصناعة والثروة المعدنية"
  },
  MINISTRY_OF_HEALTH: {
    nameAr: "ترخيص وزارة الصحة",
    nameEn: "Ministry of Health License",
    descriptionAr: "ترخيص المنشأة الصحية"
  },
  MINISTRY_OF_TOURISM: {
    nameAr: "ترخيص وزارة السياحة",
    nameEn: "Ministry of Tourism License",
    descriptionAr: "ترخيص النشاط السياحي"
  },
  MINISTRY_OF_JUSTICE: {
    nameAr: "ترخيص وزارة العدل",
    nameEn: "Ministry of Justice License",
    descriptionAr: "ترخيص المهنة القانونية أو التوثيق"
  },
  MINISTRY_OF_ENVIRONMENT: {
    nameAr: "ترخيص وزارة البيئة",
    nameEn: "Ministry of Environment Permit",
    descriptionAr: "تصريح بيئي من وزارة البيئة"
  },
  MINISTRY_OF_CULTURE: {
    nameAr: "ترخيص وزارة الثقافة",
    nameEn: "Ministry of Culture Permit",
    descriptionAr: "تصريح النشاط الثقافي أو الإبداعي"
  },
  MINISTRY_OF_SPORTS: {
    nameAr: "ترخيص وزارة الرياضة",
    nameEn: "Ministry of Sports Permit",
    descriptionAr: "تصريح النشاط الرياضي أو الترفيهي"
  },
  SFDA_LICENSE: {
    nameAr: "ترخيص هيئة الغذاء والدواء",
    nameEn: "SFDA License",
    descriptionAr: "ترخيص الأنشطة الغذائية أو الدوائية أو التجميلية"
  },
  SASO_CERTIFICATE: {
    nameAr: "شهادة هيئة المواصفات SASO",
    nameEn: "SASO Certificate",
    descriptionAr: "شهادة مطابقة المنتجات أو تسجيل SABER"
  },
  CST_LICENSE: {
    nameAr: "ترخيص هيئة الاتصالات",
    nameEn: "CST License",
    descriptionAr: "ترخيص خدمات الاتصالات أو الفضاء أو التقنية"
  },
  SAMA_LICENSE: {
    nameAr: "ترخيص البنك المركزي SAMA",
    nameEn: "SAMA License",
    descriptionAr: "ترخيص النشاط المالي أو التأمين أو الفينتك"
  },
  CMA_LICENSE: {
    nameAr: "ترخيص هيئة السوق المالية",
    nameEn: "CMA License",
    descriptionAr: "ترخيص الأنشطة في السوق المالية"
  },
  MISA_INVESTMENT_LICENSE: {
    nameAr: "ترخيص وزارة الاستثمار MISA",
    nameEn: "MISA Investment License",
    descriptionAr: "ترخيص الاستثمار الأجنبي المباشر"
  },
  MONSHAAT_REGISTRATION: {
    nameAr: "تسجيل منشآت",
    nameEn: "Monsha'at Registration",
    descriptionAr: "شهادة تسجيل المنشأة في هيئة المنشآت الصغيرة والمتوسطة"
  },
  SOCPA_MEMBERSHIP: {
    nameAr: "عضوية هيئة المحاسبين SOCPA",
    nameEn: "SOCPA Membership",
    descriptionAr: "شهادة عضوية المحاسب القانوني المعتمد"
  },
  SCE_MEMBERSHIP: {
    nameAr: "عضوية هيئة المهندسين SCE",
    nameEn: "SCE Membership",
    descriptionAr: "شهادة عضوية المهندس المعتمد"
  },
  MHRSD_NITAQAT: {
    nameAr: "شهادة نطاقات",
    nameEn: "MHRSD Nitaqat",
    descriptionAr: "شهادة نسبة التوطين من وزارة الموارد البشرية"
  },
  OTHER: {
    nameAr: "مستند آخر",
    nameEn: "Other Document",
    descriptionAr: "أي مستند حكومي آخر"
  }
};

function getDefaultSlots(profile: BusinessProfile): string[] {
  const slots: string[] = ["COMMERCIAL_REGISTRATION", "ZATCA_VAT_CERTIFICATE", "CHAMBER_OF_COMMERCE"];
  if (profile.hasEmployees) slots.push("GOSI_REGISTRATION", "QIWA_ESTABLISHMENT", "MUDAD_CERTIFICATE", "MUQEEM_ACCOUNT");
  if (profile.hasPremises) slots.push("BALADY_LICENSE", "CIVIL_DEFENSE_CERT");
  if (profile.activities.includes("manufacturing")) slots.push("MINISTRY_OF_INDUSTRY");
  if (profile.activities.includes("technology")) slots.push("CST_LICENSE");
  if (profile.activities.includes("food")) slots.push("SFDA_LICENSE");
  if (profile.activities.includes("healthcare")) slots.push("MINISTRY_OF_HEALTH");
  if (profile.activities.includes("tourism")) slots.push("MINISTRY_OF_TOURISM");
  if (profile.activities.includes("financial")) slots.push("SAMA_LICENSE", "CMA_LICENSE");
  if (profile.activities.includes("import_export")) slots.push("SASO_CERTIFICATE");
  if (profile.foreignOwnership) slots.push("MISA_INVESTMENT_LICENSE");
  return slots;
}

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
  extractionError: string | null;
};

type Props = {
  lang: Lang;
  sessionId: string;
  profile: BusinessProfile;
  onComplete: (uploaded: UploadedDoc[], results: ExtractedResult[]) => void;
  onBack: () => void;
};

export function DocumentUploadGrid({ lang, sessionId, profile, onComplete, onBack }: Props) {
  const isAr = lang === "ar";
  const [slots, setSlots] = useState<string[]>(() => getDefaultSlots(profile));
  const [uploaded, setUploaded] = useState<Map<string, { documentId: string; fileName: string }>>(new Map());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Map<string, ExtractedResult>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const crUploaded = uploaded.has("COMMERCIAL_REGISTRATION");
  const crStatus = statuses.get("COMMERCIAL_REGISTRATION");
  const crDone = crUploaded && (crStatus?.extractionStatus === "COMPLETED" || crStatus?.extractionStatus === "PARTIAL" || crStatus?.extractionStatus === "FAILED");
  const canContinue = crDone;

  // Poll extraction status every 2 seconds for any pending/processing docs
  useEffect(() => {
    function shouldPoll() {
      for (const [, v] of uploaded) {
        const st = statuses.get(v.documentId)?.extractionStatus;
        if (!st || st === "PENDING" || st === "PROCESSING") return true;
      }
      return false;
    }

    async function poll() {
      if (!shouldPoll()) return;
      try {
        const res = await fetch(`/api/upload/status?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const { documents } = (await res.json()) as { documents: ExtractedResult[] };
        setStatuses((prev) => {
          const next = new Map(prev);
          for (const d of documents) next.set(d.id, d);
          return next;
        });
      } catch {
        // network error — retry next tick
      }
    }

    pollRef.current = setInterval(() => { void poll(); }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, uploaded, statuses]);

  function handleUploaded(docType: string, documentId: string, fileName: string) {
    setUploaded((prev) => new Map(prev).set(docType, { documentId, fileName }));
    setSkipped((prev) => { const n = new Set(prev); n.delete(docType); return n; });
  }

  function handleSkipped(docType: string, val: boolean) {
    setSkipped((prev) => {
      const n = new Set(prev);
      val ? n.add(docType) : n.delete(docType);
      return n;
    });
  }

  function handleAddDoc(opt: DocTypeOption) {
    if (!slots.includes(opt.value)) setSlots((prev) => [...prev, opt.value]);
  }

  function handleRemoveSlot(docType: string) {
    setSlots((prev) => prev.filter((s) => s !== docType));
    setSkipped((prev) => { const n = new Set(prev); n.delete(docType); return n; });
    setUploaded((prev) => { const n = new Map(prev); n.delete(docType); return n; });
  }

  function handleContinue() {
    if (pollRef.current) clearInterval(pollRef.current);
    const uploadedArr: UploadedDoc[] = [];
    for (const [docType, v] of uploaded) {
      uploadedArr.push({ docType, ...v });
    }
    const resultsArr = [...statuses.values()];
    onComplete(uploadedArr, resultsArr);
  }

  const defaultSlotSet = new Set(getDefaultSlots(profile));
  const existingTypeSet = new Set(slots);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button type="button" onClick={onBack} className="text-sm text-navy-600 hover:underline mb-3 block">
          {isAr ? "→ رجوع" : "← Back"}
        </button>
        <h1 className="text-xl font-bold text-navy-900">
          {isAr ? "رفع المستندات" : "Upload Documents"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAr
            ? "ارفع ما لديك — سيستخرج الذكاء الاصطناعي البيانات تلقائياً"
            : "Upload what you have — AI will extract the data automatically"}
        </p>
      </div>

      {/* Required section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {isAr ? "المستندات المطلوبة" : "Required Documents"}
        </h2>
        <div className="space-y-3">
          {slots.map((docType) => {
            const meta = DOC_META[docType] ?? { nameAr: docType, nameEn: docType, descriptionAr: "" };
            const up = uploaded.get(docType);
            const st = up ? statuses.get(up.documentId) : null;
            const isRequired = docType === "COMMERCIAL_REGISTRATION";
            const isDefault = defaultSlotSet.has(docType);

            const docStatus: DocStatus | null = up
              ? {
                  documentId: up.documentId,
                  fileName: up.fileName,
                  status: (st?.extractionStatus as DocStatus["status"]) ?? "PENDING",
                  extractionError: st?.extractionError ?? null
                }
              : null;

            return (
              <DocumentUploadCard
                key={docType}
                docType={docType}
                nameAr={meta.nameAr}
                nameEn={meta.nameEn}
                descriptionAr={meta.descriptionAr}
                required={isRequired}
                skippable={!isRequired}
                lang={lang}
                sessionId={sessionId}
                docStatus={docStatus}
                skipped={skipped.has(docType)}
                removable={!isDefault}
                onUploaded={(did, fname) => handleUploaded(docType, did, fname)}
                onSkippedChange={(val) => handleSkipped(docType, val)}
                onRemove={() => handleRemoveSlot(docType)}
              />
            );
          })}
        </div>
      </section>

      {/* Add more section */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {isAr ? "إضافة مستندات أخرى" : "Add Other Documents"}
        </h2>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="w-full border-2 border-dashed border-navy-200 rounded-lg py-3 text-sm text-navy-600 hover:border-navy-400 hover:bg-navy-50 transition-colors font-medium"
        >
          + {isAr ? "إضافة مستند آخر" : "Add Another Document"}
        </button>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-xs text-gray-400">
          {isAr
            ? "السجل التجاري مطلوب للمتابعة"
            : "Commercial Registration required to continue"}
        </div>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          title={
            !canContinue
              ? isAr
                ? "السجل التجاري مطلوب لإكمال التسجيل"
                : "CR required to continue"
              : undefined
          }
          className="px-5 py-2.5 rounded-lg bg-navy-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy-800 transition-colors"
        >
          {isAr ? "التالي — مراجعة البيانات" : "Next — Review data"}
        </button>
      </div>

      <AddDocumentDialog
        open={dialogOpen}
        lang={lang}
        existingTypes={existingTypeSet}
        onSelect={handleAddDoc}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
