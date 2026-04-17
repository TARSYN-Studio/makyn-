"use client";

import { useTransition } from "react";

import { endSessionAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

export function EndSessionButton({ sessionId, lang }: { sessionId: string; lang: Lang }) {
  const [isPending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        start(() => {
          void endSessionAction(sessionId);
        });
      }}
    >
      {t("settings.session.logout", lang)}
    </Button>
  );
}
