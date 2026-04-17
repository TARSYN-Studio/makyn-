"use client";

import { useTransition } from "react";

import { disconnectTelegramAction } from "@/actions/channels";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

export function DisconnectTelegramButton({ lang }: { lang: Lang }) {
  const [isPending, start] = useTransition();

  const onClick = () => {
    const confirmText =
      lang === "ar" ? "فصل حساب Telegram؟" : "Disconnect Telegram?";
    if (!window.confirm(confirmText)) return;
    start(() => {
      void disconnectTelegramAction();
    });
  };

  return (
    <Button variant="secondary" size="sm" onClick={onClick} disabled={isPending}>
      {t("channels.telegram.disconnect", lang)}
    </Button>
  );
}
