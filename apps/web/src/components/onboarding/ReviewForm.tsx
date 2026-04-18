"use client";

import { useState, useTransition } from "react";

import { ReviewFieldGroup, type ReviewField } from "./ReviewFieldGroup";
import { mergeExtractedFields } from "@makyn/core/ai/extracted-fields";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

type ExtractedResult = {
  id: string;
  docType: string;
  extractionStatus: string;
  extractedData: unknown;
  extractionConfidence: number | null;
};

type UploadedDoc = {
  documentId: string;
  fileName: string;
  docType: string;
};

type Props = {
  lang: Lang;
  sessionId: string;
  uploadedDocs: UploadedDoc[];
  results: ExtractedResult[];
  onSaved: (companyId: string) => void;
  onBack: () => void;
};

// Build display label sets for each group
const CR_FIELDS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "legalNameAr", labelAr: "الاسم النظامي بالعربية", labelEn: "Legal Name (Arabic)" },
  { key: "legalNameEn", labelAr: "الاسم النظامي بالإنجليزية", labelEn: "Legal Name (English)" },
  { key: "tradeName", labelAr: "الاسم التجاري", labelEn: "Trade Name" },
  { key: "businessType", labelAr: "نوع النشاط", labelEn: "Business Type" },
  { key: "ownerLegalName", labelAr: "اسم المالك", labelEn: "Owner Name" },
  { key: "crNumber", labelAr: "رقم السجل التجاري", labelEn: "CR Number" },
  { key: "crIssueDate", labelAr: "تاريخ الإصدار", labelEn: "Issue Date" },
  { key: "crExpiryDate", labelAr: "تاريخ الانتهاء", labelEn: "Expiry Date" }
];

const TAX_FIELDS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "zatcaTin", labelAr: "الرقم الضريبي", labelEn: "ZATCA TIN" },
  { key: "vatRegistrationNumber", labelAr: "رقم تسجيل ضريبة القيمة المضافة", labelEn: "VAT Registration #" }
];

const LABOR_FIELDS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "gosiEmployerNumber", labelAr: "رقم التأمينات الاجتماعية", labelEn: "GOSI Employer Number" },
  { key: "qiwaEstablishmentId", labelAr: "معرف المنشأة في قوى", labelEn: "Qiwa Establishment ID" },
  { key: "molFileNumber", labelAr: "رقم ملف العمل", labelEn: "MOL File Number" },
  { key: "saudizationCategory", labelAr: "تصنيف التوطين", labelEn: "Saudization Category" }
];

const IMMIGRATION_FIELDS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "muqeemAccountNumber", labelAr: "رقم حساب مقيم", labelEn: "Muqeem Account Number" },
  { key: "moi700Number", labelAr: "رقم 700 وزارة الداخلية", labelEn: "MOI 700 Number" }
];

const MUNICIPAL_FIELDS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "baladyLicenseNumber", labelAr: "رقم الرخصة البلدية", labelEn: "Balady License Number" },
  { key: "baladyLicenseType", labelAr: "نوع الرخصة البلدية", labelEn: "License Type" },
  { key: "baladyExpiryDate", labelAr: "انتهاء الرخصة البلدية", labelEn: "License Expiry" }
];

const EXTRA_FIELDS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "chamberMembershipNumber", labelAr: "رقم عضوية الغرفة التجارية", labelEn: "Chamber Membership #" },
  { key: "civilDefenseCertNumber", labelAr: "رقم شهادة الدفاع المدني", labelEn: "Civil Defense Cert #" },
  { key: "industryLicenseNumber", labelAr: "رقم ترخيص وزارة الصناعة", labelEn: "Industry License #" },
  { key: "sfdaLicenseNumber", labelAr: "رقم ترخيص الغذاء والدواء", labelEn: "SFDA License #" },
  { key: "mohLicenseNumber", labelAr: "رقم ترخيص وزارة الصحة", labelEn: "MOH License #" },
  { key: "tourismLicenseNumber", labelAr: "رقم ترخيص السياحة", labelEn: "Tourism License #" },
  { key: "cstLicenseNumber", labelAr: "رقم ترخيص الاتصالات", labelEn: "CST License #" },
  { key: "samaLicenseNumber", labelAr: "رقم ترخيص البنك المركزي", labelEn: "SAMA License #" },
  { key: "cmaLicenseNumber", labelAr: "رقم ترخيص السوق المالية", labelEn: "CMA License #" },
  { key: "misaLicenseNumber", labelAr: "رقم ترخيص وزارة الاستثمار", labelEn: "MISA License #" },
  { key: "sasoCertNumber", labelAr: "رقم شهادة المواصفات", labelEn: "SASO Cert #" },
  { key: "monshaatRegistrationId", labelAr: "رقم تسجيل منشآت", labelEn: "Monsha'at ID" }
];

type FormValues = Record<string, string>;

function buildInitialValues(uploadedDocs: UploadedDoc[], results: ExtractedResult[]): FormValues {
  const merged: Record<string, string> = {};
  // Process CR first, then others, so CR values win for shared fields
  const orderedTypes = ["COMMERCIAL_REGISTRATION", ...uploadedDocs.map((d) => d.docType).filter((t) => t !== "COMMERCIAL_REGISTRATION")];

  for (const docType of orderedTypes) {
    const result = results.find((r) => r.docType === docType && r.extractedData);
    if (!result?.extractedData) continue;
    const fields = mergeExtractedFields(
      docType as Parameters<typeof mergeExtractedFields>[0],
      result.extractedData as Record<string, unknown>
    );
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && v !== null && String(v).trim() && !merged[k]) {
        merged[k] = String(v);
      }
    }
  }
  return merged;
}

function getConfidenceForField(
  key: string,
  uploadedDocs: UploadedDoc[],
  results: ExtractedResult[]
): number | undefined {
  // Find result that contributed this field
  for (const doc of uploadedDocs) {
    const result = results.find((r) => r.docType === doc.docType);
    if (!result?.extractedData) continue;
    const fields = mergeExtractedFields(
      doc.docType as Parameters<typeof mergeExtractedFields>[0],
      result.extractedData as Record<string, unknown>
    );
    if (key in fields && result.extractionConfidence !== null) {
      return result.extractionConfidence;
    }
  }
  return undefined;
}

function getSourceForField(
  key: string,
  uploadedDocs: UploadedDoc[],
  results: ExtractedResult[],
  lang: Lang
): string | undefined {
  const DOC_NAMES: Record<string, { ar: string; en: string }> = {
    COMMERCIAL_REGISTRATION: { ar: "السجل التجاري", en: "CR" },
    ZATCA_VAT_CERTIFICATE: { ar: "شهادة VAT", en: "VAT Cert" },
    GOSI_REGISTRATION: { ar: "التأمينات", en: "GOSI" },
    QIWA_ESTABLISHMENT: { ar: "قوى", en: "Qiwa" },
    MUQEEM_ACCOUNT: { ar: "مقيم", en: "Muqeem" },
    BALADY_LICENSE: { ar: "بلدي", en: "Balady" },
    CHAMBER_OF_COMMERCE: { ar: "الغرفة التجارية", en: "Chamber" },
    MUDAD_CERTIFICATE: { ar: "مدد", en: "Mudad" },
    CIVIL_DEFENSE_CERT: { ar: "الدفاع المدني", en: "Civil Defense" }
  };

  for (const doc of uploadedDocs) {
    const result = results.find((r) => r.docType === doc.docType);
    if (!result?.extractedData) continue;
    const fields = mergeExtractedFields(
      doc.docType as Parameters<typeof mergeExtractedFields>[0],
      result.extractedData as Record<string, unknown>
    );
    if (key in fields) {
      const name = DOC_NAMES[doc.docType];
      return name ? (lang === "ar" ? name.ar : name.en) : doc.docType;
    }
  }
  return undefined;
}

function buildFieldList(
  defs: Array<{ key: string; labelAr: string; labelEn: string }>,
  values: FormValues,
  uploadedDocs: UploadedDoc[],
  results: ExtractedResult[],
  lang: Lang
): ReviewField[] {
  return defs
    .filter((f) => values[f.key] !== undefined)
    .map((f) => ({
      key: f.key,
      labelAr: f.labelAr,
      labelEn: f.labelEn,
      value: values[f.key] ?? "",
      confidence: getConfidenceForField(f.key, uploadedDocs, results),
      source: getSourceForField(f.key, uploadedDocs, results, lang)
    }));
}

export function ReviewForm({ lang, sessionId, uploadedDocs, results, onSaved, onBack }: Props) {
  const isAr = lang === "ar";
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(uploadedDocs, results));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const skippedDocs = uploadedDocs
    .map((d) => d.docType)
    .filter((t) => {
      const r = results.find((res) => res.docType === t);
      return !r || r.extractionStatus === "FAILED";
    });

  const crFields = buildFieldList(CR_FIELDS, values, uploadedDocs, results, lang);
  const taxFields = buildFieldList(TAX_FIELDS, values, uploadedDocs, results, lang);
  const laborFields = buildFieldList(LABOR_FIELDS, values, uploadedDocs, results, lang);
  const immigrationFields = buildFieldList(IMMIGRATION_FIELDS, values, uploadedDocs, results, lang);
  const municipalFields = buildFieldList(MUNICIPAL_FIELDS, values, uploadedDocs, results, lang);
  const extraFields = buildFieldList(EXTRA_FIELDS, values, uploadedDocs, results, lang);

  // Always show legalNameAr field even if not pre-filled
  if (!values["legalNameAr"] && !crFields.find((f) => f.key === "legalNameAr")) {
    crFields.unshift({
      key: "legalNameAr",
      labelAr: "الاسم النظامي بالعربية",
      labelEn: "Legal Name (Arabic)",
      value: ""
    });
  }

  async function handleSave() {
    setError(null);
    const legalNameAr = (values["legalNameAr"] ?? "").trim();
    if (!legalNameAr) {
      setError(isAr ? "الاسم النظامي بالعربية مطلوب" : "Legal Arabic name is required");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/organizations/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values, sessionId, documentIds: uploadedDocs.map((d) => d.documentId) })
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Save failed");
        }
        const { companyId } = (await res.json()) as { companyId: string };
        onSaved(companyId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button type="button" onClick={onBack} className="text-[13px] text-[var(--accent)] hover:underline mb-3 block">
          {isAr ? "→ رجوع لتعديل المستندات" : "← Back to edit documents"}
        </button>
        <h1 className="text-[20px] font-semibold text-[var(--text)]">
          {isAr ? "راجع وأكد البيانات" : "Review and confirm"}
        </h1>
        <p className="text-[13px] text-[var(--text-mid)] mt-1">
          {isAr
            ? "البيانات مستخرجة تلقائياً — راجعها وعدّل ما يلزم"
            : "Data extracted automatically — review and edit as needed"}
        </p>
      </div>

      <div className="space-y-4">
        <ReviewFieldGroup
          titleAr="البيانات الأساسية (من السجل التجاري)"
          titleEn="Basic Information (from CR)"
          fields={crFields}
          lang={lang}
          onChange={handleChange}
        />
        <ReviewFieldGroup
          titleAr="الضرائب والزكاة (من شهادة ZATCA)"
          titleEn="Tax & Zakat (from ZATCA)"
          fields={taxFields}
          lang={lang}
          onChange={handleChange}
        />
        <ReviewFieldGroup
          titleAr="العمالة والتأمينات الاجتماعية"
          titleEn="Labor & Social Insurance"
          fields={laborFields}
          lang={lang}
          onChange={handleChange}
        />
        <ReviewFieldGroup
          titleAr="الإقامة"
          titleEn="Immigration"
          fields={immigrationFields}
          lang={lang}
          onChange={handleChange}
        />
        <ReviewFieldGroup
          titleAr="الرخصة البلدية"
          titleEn="Municipal License"
          fields={municipalFields}
          lang={lang}
          onChange={handleChange}
        />
        <ReviewFieldGroup
          titleAr="تراخيص وشهادات أخرى"
          titleEn="Other Licenses & Certificates"
          fields={extraFields}
          lang={lang}
          onChange={handleChange}
        />

        {skippedDocs.length > 0 && (
          <div className="border border-[var(--border)] rounded-lg p-4">
            <p className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">
              {isAr ? "مستندات لاحقة" : "Skipped Documents"}
            </p>
            <ul className="space-y-1">
              {skippedDocs.map((dt) => (
                <li key={dt} className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-mid)]">○ {dt.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-[var(--text-dim)]">
                    {isAr ? "سأضيفه لاحقاً" : "Add later"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-[var(--red)] bg-[var(--red-l)] border border-[var(--red)]/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
        <Button
          disabled={isPending}
          onClick={handleSave}
          size="lg"
        >
          {isPending
            ? isAr ? "جاري الحفظ..." : "Saving..."
            : isAr ? "حفظ الشركة" : "Save Company"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
        >
          {isAr ? "رجوع لتعديل المستندات" : "Back to documents"}
        </Button>
      </div>
    </div>
  );
}
