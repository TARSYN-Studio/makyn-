"use client";

import { useState, useTransition } from "react";

import { IssueStatus } from "@makyn/db";
import { updateIssueStatusAction } from "@/actions/issues";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t, type Lang } from "@/lib/i18n";

const STATUSES: IssueStatus[] = [
  IssueStatus.OPEN,
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.WITH_PROFESSIONAL,
  IssueStatus.WAITING_GOVERNMENT,
  IssueStatus.ESCALATED,
  IssueStatus.RESOLVED,
  IssueStatus.ARCHIVED
];

export function StatusChangeForm({
  issueId,
  current,
  lang
}: {
  issueId: string;
  current: IssueStatus;
  lang: Lang;
}) {
  const [status, setStatus] = useState<IssueStatus>(current);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isPending, start] = useTransition();

  const needsNote = status === IssueStatus.RESOLVED;

  const submit = () => {
    start(() => {
      const fd = new FormData();
      fd.set("status", status);
      fd.set("resolutionNotes", resolutionNotes);
      void updateIssueStatusAction(issueId, fd);
    });
  };

  return (
    <div className="space-y-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as IssueStatus)}
        className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`issue.status.${s}`, lang)}
          </option>
        ))}
      </select>
      {needsNote && (
        <Textarea
          placeholder={lang === "ar" ? "ملاحظات الحل" : "Resolution notes"}
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          rows={3}
        />
      )}
      <Button onClick={submit} disabled={isPending || (needsNote && !resolutionNotes.trim())}>
        {t("common.save", lang)}
      </Button>
    </div>
  );
}
