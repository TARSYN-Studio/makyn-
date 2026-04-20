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
// Variable font — must not declare `weight` when `axes` is set,
// otherwise next/font errors at build: "Axes can only be defined for
// variable fonts" (thrown when the weight array forces a static subset).
const fraunces = Fraunces({
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
  description: "A compliance instrument for Saudi Arabia.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" }
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }]
  },
  manifest: "/favicon/site.webmanifest"
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
