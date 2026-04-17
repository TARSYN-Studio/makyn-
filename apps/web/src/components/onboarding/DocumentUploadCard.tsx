"use client";

import { useRef, useState } from "react";

import { ExtractionStatusBadge } from "./ExtractionStatusBadge";
import type { Lang } from "@/lib/i18n";

export type DocStatus = {
  documentId: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
  fileName?: string;
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
          ? "border-gray-200 bg-gray-50 opacity-60"
          : docStatus?.status === "COMPLETED"
            ? "border-green-200 bg-green-50"
            : docStatus?.status === "FAILED"
              ? "border-red-200 bg-red-50"
              : "border-navy-200 bg-white"
      }`}
    >
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 end-2 text-gray-400 hover:text-red-500 text-lg leading-none"
          aria-label="Remove"
        >
          ×
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-800 text-sm">
            {isAr ? nameAr : nameEn}
            {required && <span className="text-red-500 ms-1">*</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{isAr ? descriptionAr : nameEn}</p>
        </div>
        {docStatus && (
          <div className="flex-shrink-0">
            <ExtractionStatusBadge status={docStatus.status} lang={lang} />
          </div>
        )}
      </div>

      {!skipped && (
        <div className="mt-3">
          {docStatus?.documentId ? (
            <p className="text-xs text-gray-600 truncate">
              <span className="text-green-600">✓</span> {docStatus.fileName ?? "uploaded"}
              {docStatus.status === "FAILED" && (
                <span className="text-red-600 ms-2">
                  {isAr ? "فشل التحليل" : "Extraction failed"}
                </span>
              )}
            </p>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-navy-400 rounded-md p-3 text-center cursor-pointer transition-colors"
            >
              {uploading ? (
                <span className="text-xs text-blue-600 animate-pulse">
                  {isAr ? "جاري الرفع..." : "Uploading..."}
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  {isAr
                    ? "انقر لرفع الملف أو اسحب وأفلت"
                    : "Click to upload or drag & drop"}
                  <br />
                  <span className="text-gray-400">PDF / PNG / JPG / HEIC — 10 MB max</span>
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
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      )}

      {skippable && !required && !docStatus?.documentId && (
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={skipped}
            onChange={(e) => onSkippedChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-navy-600"
          />
          <span className="text-xs text-gray-500">
            {isAr ? "سأضيفه لاحقاً" : "Add later"}
          </span>
        </label>
      )}

      {skipped && (
        <p className="mt-2 text-xs text-gray-400">
          {isAr ? "سأضيفه لاحقاً" : "Add later"}{" "}
          <button
            type="button"
            className="text-navy-600 underline"
            onClick={() => onSkippedChange(false)}
          >
            {isAr ? "إضافة الآن" : "Add now"}
          </button>
        </p>
      )}
    </div>
  );
}
