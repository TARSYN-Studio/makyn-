"use client";

import { useState, useTransition } from "react";

import { createTelegramConnectTokenAction } from "@/actions/channels";
import { Button } from "@/components/ui/button";
import { t, type Lang } from "@/lib/i18n";

export function ConnectTelegramCard({ lang }: { lang: Lang }) {
  const [link, setLink] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const connect = () => {
    start(async () => {
      const { token, botUsername } = await createTelegramConnectTokenAction();
      const url = `https://t.me/${botUsername}?start=connect_${token}`;
      setLink(url);
      if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {lang === "ar"
          ? "اربط حسابك بـ Telegram لتستقبل وتحوّل الإشعارات الحكومية إلى قضايا داخل لوحة التحكم."
          : "Link your Telegram account to receive and convert government notices into issues inside your dashboard."}
      </p>
      <Button onClick={connect} disabled={isPending}>
        {t("channels.telegram.cta", lang)}
      </Button>
      {link && (
        <p className="text-xs text-slate-500 break-all">
          {lang === "ar" ? "لم يفتح Telegram؟ افتح الرابط مباشرة:" : "Telegram didn't open? Click directly:"}{" "}
          <a className="text-navy-600 hover:underline" href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </p>
      )}
    </div>
  );
}
