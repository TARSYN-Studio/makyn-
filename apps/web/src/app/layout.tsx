import "./globals.css";

import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono, Tajawal } from "next/font/google";

import { getCurrentUser } from "@/lib/session";
import type { Lang } from "@/lib/i18n";
import { dirFor } from "@/lib/i18n";

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"]
});

// Fraunces is loaded but reserved — italic axis only, used for empty-state
// hero sentences, the 404 headline, and the first-login welcome line.
// Never for page headings, body, buttons, or form labels.
const fraunces = Fraunces({
  weight: ["400", "500"],
  style: ["italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-serif",
  display: "swap",
  subsets: ["latin"]
});

const mono = JetBrains_Mono({
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  subsets: ["latin"]
});

const arabic = Tajawal({
  weight: ["400", "500", "700", "800"],
  variable: "--font-ar",
  display: "swap",
  subsets: ["arabic", "latin"]
});

export const metadata: Metadata = {
  title: "MAKYN",
  description: "مكين — مركز عمليات الامتثال السعودي"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const lang: Lang = (user?.preferredLanguage === "en" ? "en" : "ar");
  return (
    <html
      lang={lang}
      dir={dirFor(lang)}
      className={`${inter.variable} ${fraunces.variable} ${mono.variable} ${arabic.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
