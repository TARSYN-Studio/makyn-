import "./globals.css";

import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";

import { getCurrentUser } from "@/lib/session";
import type { Lang } from "@/lib/i18n";
import { dirFor } from "@/lib/i18n";

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"]
});

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
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

const arabic = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ar",
  display: "swap",
  subsets: ["arabic"]
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
      className={`${inter.variable} ${serif.variable} ${mono.variable} ${arabic.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
