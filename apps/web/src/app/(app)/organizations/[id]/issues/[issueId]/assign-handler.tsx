"use client";

import { useState, useTransition } from "react";

import { assignHandlerAction } from "@/actions/issues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Lang } from "@/lib/i18n";

export function AssignHandlerForm({
  issueId,
  initial,
  lang
}: {
  issueId: string;
  initial: string;
  lang: Lang;
}) {
  const [name, setName] = useState(initial);
  const [isPending, start] = useTransition();

  const submit = () => {
    start(() => {
      const fd = new FormData();
      fd.set("assignedHandlerName", name);
      void assignHandlerAction(issueId, fd);
    });
  };

  return (
    <div>
      <Label htmlFor="handler-name">{t("issue.assignedHandler", lang)}</Label>
      <div className="flex items-center gap-2">
        <Input id="handler-name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" onClick={submit} disabled={isPending}>
          {t("common.save", lang)}
        </Button>
      </div>
    </div>
  );
}
