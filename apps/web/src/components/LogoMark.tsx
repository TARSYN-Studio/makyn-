/* eslint-disable @next/next/no-img-element */
"use client";

// Plain <img> so the page renders even if the SVG asset is missing —
// no next/image build-time optimisation pass.
//
// Wordmark renders inside a fixed-size box with `object-fit: contain` so
// every (lang × theme) variant reads at identical optical size regardless
// of the source SVG's internal padding. Theme is watched via a
// MutationObserver on <html data-theme>.

import { useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";

type Size = "sm" | "lg";
type Surface = "paper" | "ink" | "auto";

function logoSrc(lang: Lang, surface: "paper" | "ink"): string {
  const locale = lang === "ar" ? "ar" : "en";
  const onInk = surface === "ink" ? "-onink" : "";
  return `/logos/makyn-${locale}${onInk}.svg`;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const read = () => document.documentElement.getAttribute("data-theme") === "dark";
    setIsDark(read());
    const obs = new MutationObserver(() => setIsDark(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export function LogoMark({
  lang,
  surface = "paper",
  className = "",
  title = "MAKYN"
}: {
  lang: Lang;
  surface?: "paper" | "ink";
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={logoSrc(lang, surface)}
      alt={title}
      className={`block h-10 w-auto ${className}`}
    />
  );
}

export function Wordmark({
  lang,
  surface = "auto",
  size = "sm",
  boxWidth = 140,
  boxHeight,
  className = "",
  title = "MAKYN"
}: {
  lang: Lang;
  surface?: Surface;
  size?: Size;
  boxWidth?: number;
  boxHeight?: number;
  className?: string;
  title?: string;
}) {
  const isAr = lang === "ar";
  const isDark = useIsDark();
  const resolvedSurface: "paper" | "ink" =
    surface === "auto" ? (isDark ? "ink" : "paper") : surface;

  // sm = chrome lockup (48px box). lg = login / hero lockup (80px box).
  const resolvedHeight = boxHeight ?? (size === "lg" ? 80 : 48);

  return (
    <span
      className={`inline-flex items-center flex-none ${className}`}
      style={{
        width: boxWidth,
        height: resolvedHeight,
        justifyContent: isAr ? "flex-end" : "flex-start"
      }}
    >
      <img
        src={logoSrc(lang, resolvedSurface)}
        alt={title}
        draggable={false}
        className="select-none block"
        style={{
          maxHeight: "100%",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: isAr ? "right center" : "left center"
        }}
      />
    </span>
  );
}
