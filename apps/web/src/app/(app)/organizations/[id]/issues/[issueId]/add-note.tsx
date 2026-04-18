"use client";

import { useRef, useTransition } from "react";

import { addIssueNoteAction } from "@/actions/issues";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t, type Lang } from "@/lib/i18n";

export function AddNoteForm({ issueId, lang }: { issueId: string; lang: Lang }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isPending, start] = useTransition();

  const submit = () => {
    const content = ref.current?.value ?? "";
    if (!content.trim()) return;
    start(() => {
      const fd = new FormData();
      fd.set("content", content);
      void addIssueNoteAction(issueId, fd);
      if (ref.current) ref.current.value = "";
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        ref={ref}
        rows={3}
        placeholder={lang === "ar" ? "أضف ملاحظة..." : "Add a note..."}
      />
      <Button onClick={submit} disabled={isPending} size="sm">
        {t("issue.addNote", lang)}
      </Button>
    </div>
  );
}
