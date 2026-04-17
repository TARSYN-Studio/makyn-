import "./globals.css";

import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/session";
import type { Lang } from "@/lib/i18n";
import { dirFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "MAKYN",
  description: "مكين — مركز عمليات الامتثال السعودي"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const lang: Lang = (user?.preferredLanguage === "en" ? "en" : "ar");
  return (
    <html lang={lang} dir={dirFor(lang)}>
      <body>{children}</body>
    </html>
  );
}
