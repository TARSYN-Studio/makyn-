"use client";

import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

export function CopyHandlerBrief({ text, lang }: { text: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 p-3 whitespace-pre-wrap">
        {text}
      </div>
      <Button variant="gold" size="sm" onClick={copy}>
        {copied ? <Check className="h-3.5 w-3.5 me-1" /> : <ClipboardCopy className="h-3.5 w-3.5 me-1" />}
        {t("issue.sendToHandler", lang)}
      </Button>
    </div>
  );
}
