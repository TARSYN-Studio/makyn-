"use client";

import { useTransition } from "react";

import { archiveCompanyAction } from "@/actions/organizations";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

export function ArchiveCompanyButton({ companyId, lang }: { companyId: string; lang: Lang }) {
  const [isPending, start] = useTransition();

  const onClick = () => {
    const confirmText = lang === "ar" ? "أرشفة هذه الشركة؟" : "Archive this company?";
    if (!window.confirm(confirmText)) return;
    start(() => {
      void archiveCompanyAction(companyId);
    });
  };

  return (
    <Button variant="secondary" onClick={onClick} disabled={isPending}>
      {t("company.archive", lang)}
    </Button>
  );
}
