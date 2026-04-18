"use client";

import { useRef, useState } from "react";

import { ExtractionStatusBadge } from "./ExtractionStatusBadge";
import type { Lang } from "@/lib/i18n";

export type DocStatus = {
  documentId: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
  fileName?: string;
  extractionError?: string | null;
};

type Props = {
  docType: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  required?: boolean;
  skippable?: boolean;
  lang: Lang;
  sessionId: string;
  docStatus: DocStatus | null;
  skipped: boolean;
  removable?: boolean;
  onUploaded: (documentId: string, fileName: string) => void;
  onSkippedChange: (skipped: boolean) => void;
  onRemove?: () => void;
};

function friendlyError(raw: string | null | undefined, isAr: boolean): string {
  const msg = (raw ?? "").toString();
  if (!msg) {
    return isAr
      ? "تعذّر استخراج النص من هذا الملف — جرّب ملفاً مختلفاً أو أدخل البيانات يدوياً."
      : "Could not extract text from this file — try a different file or enter data manually.";
  }
  const lower = msg.toLowerCase();
  if (lower.includes("arabic") || lower.includes("ocr") || lower.includes("text")) {
    return isAr
      ? "تعذّر قراءة النص العربي من هذا الملف — جرّب صورة أوضح أو ملف PDF مختلف."
      : "Arabic text could not be parsed from this file — try a clearer scan or different PDF.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return isAr
      ? "انتهت مهلة المعالجة — جرّب مرة أخرى أو استخدم ملفاً أصغر."
      : "Processing timed out — try again or use a smaller file.";
  }
  if (lower.includes("pdf") && (lower.includes("corrupt") || lower.includes("invalid"))) {
    return isAr
      ? "ملف PDF غير صالح أو تالف — جرّب تصدير الملف مرة أخرى."
      : "Invalid or corrupt PDF — try re-exporting the file.";
  }
  return isAr
    ? `تعذّر التحليل: ${msg}`
    : `Extraction failed: ${msg}`;
}

export function DocumentUploadCard({
  docType,
  nameAr,
  nameEn,
  descriptionAr,
  required,
  skippable,
  lang,
  sessionId,
  docStatus,
  skipped,
  removable,
  onUploaded,
  onSkippedChange,
  onRemove
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = lang === "ar";
  const status = docStatus?.status;
  const failed = status === "FAILED";

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("docType", docType);
    form.append("sessionId", sessionId);
    form.append("file", file);

    try {
      const res = await fetch("/api/upload/company-doc", { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }
      const { documentId, fileName } = (await res.json()) as {
        documentId: string;
        fileName: string;
      };
      onUploaded(documentId, fileName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload error");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      className={`relative border rounded-lg p-4 transition-colors ${
        skipped
          ? "border-[var(--border)] bg-[var(--surface)] opacity-60"
          : status === "COMPLETED"
            ? "border-[var(--green)]/30 bg-[var(--green-l)]"
            : failed
              ? "border-[var(--amber)]/30 bg-[var(--amber-l)]"
              : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 end-2 text-[var(--text-dim)] hover:text-[var(--red)] text-lg leading-none"
          aria-label="Remove"
        >
          ×
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text)] text-[13px]">
            {isAr ? nameAr : nameEn}
            {required && <span className="text-[var(--red)] ms-1">*</span>}
          </p>
          <p className="text-[11px] text-[var(--text-mid)] mt-0.5">{isAr ? descriptionAr : nameEn}</p>
        </div>
        {docStatus && !failed && (
          <div className="flex-shrink-0">
            <ExtractionStatusBadge status={docStatus.status} lang={lang} />
          </div>
        )}
      </div>

      {!skipped && (
        <div className="mt-3">
          {docStatus?.documentId && !failed ? (
            <p className="text-[11px] text-[var(--text-mid)] truncate">
              <span className="text-[var(--green)]">✓</span> {docStatus.fileName ?? "uploaded"}
            </p>
          ) : failed && docStatus?.documentId ? (
            <div className="space-y-2">
              <p className="text-[11px] text-[var(--amber)]">
                {friendlyError(docStatus.extractionError, isAr)}
              </p>
              <div className="flex items-center gap-3 text-[11px]">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-medium text-[var(--amber)] underline underline-offset-2 hover:opacity-80"
                >
                  {isAr ? "إعادة المحاولة" : "Retry"}
                </button>
                <span className="text-[var(--amber)]/60">·</span>
                {skippable && !required && (
                  <button
                    type="button"
                    onClick={() => onSkippedChange(true)}
                    className="font-medium text-[var(--amber)] hover:opacity-80"
                  >
                    {isAr ? "إدخال يدوي لاحقاً" : "Enter manually"}
                  </button>
                )}
              </div>
              {docStatus.extractionError && (
                <details className="text-[11px] text-[var(--amber)]/70">
                  <summary className="cursor-pointer hover:opacity-100">
                    {isAr ? "عرض التفاصيل التقنية" : "See technical details"}
                  </summary>
                  <pre className="mt-1 whitespace-pre-wrap break-words font-mono bg-[var(--amber-l)] rounded p-2">
                    {docStatus.extractionError}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              className="border border-dashed border-[var(--border-s)] hover:border-[var(--accent)] rounded-lg p-3 text-center cursor-pointer transition-colors"
            >
              {uploading ? (
                <span className="text-[11px] text-[var(--accent)] animate-pulse">
                  {isAr ? "جاري الرفع..." : "Uploading..."}
                </span>
              ) : (
                <span className="text-[11px] text-[var(--text-mid)]">
                  {isAr
                    ? "انقر لرفع الملف أو اسحب وأفلت"
                    : "Click to upload or drag & drop"}
                  <br />
                  <span className="text-[var(--text-dim)]">PDF / PNG / JPG / HEIC — 10 MB max</span>
                </span>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pdf,.png,.jpg,.jpeg,.heic"
            onChange={handleInputChange}
          />
          {error && <p className="text-[11px] text-[var(--red)] mt-1">{error}</p>}
        </div>
      )}

      {skippable && !required && !docStatus?.documentId && !skipped && (
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={false}
            onChange={(e) => onSkippedChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
          />
          <span className="text-[11px] text-[var(--text-mid)]">
            {isAr ? "سأضيفه لاحقاً" : "Add later"}
          </span>
        </label>
      )}

      {skipped && (
        <p className="mt-2 text-[11px] text-[var(--text-mid)] flex items-center gap-2">
          <span className="text-[var(--text-dim)]">✓</span>
          {isAr ? "سيُضاف لاحقاً" : "Skipping"}
          <span className="text-[var(--text-dim)]">·</span>
          <button
            type="button"
            className="text-[var(--accent)] hover:text-[var(--accent-mid)] underline underline-offset-2"
            onClick={() => onSkippedChange(false)}
          >
            {isAr ? "تغيير" : "change"}
          </button>
        </p>
      )}
    </div>
  );
}
