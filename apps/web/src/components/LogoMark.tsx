/* eslint-disable @next/next/no-img-element */
// Plain <img> so the page renders even if the SVG asset is missing —
// no next/image build-time optimisation pass.

import type { Lang } from "@/lib/i18n";

type Size = "sm" | "lg";
type Surface = "paper" | "ink";

function logoSrc(lang: Lang, surface: Surface): string {
  const locale = lang === "ar" ? "ar" : "en";
  const onInk = surface === "ink" ? "-onink" : "";
  return `/logos/makyn-${locale}${onInk}.svg`;
}

export function LogoMark({
  lang,
  surface = "paper",
  className = "",
  title = "MAKYN"
}: {
  lang: Lang;
  surface?: Surface;
  className?: string;
  title?: string;
}) {
  return (
    <img
      src={logoSrc(lang, surface)}
      alt={title}
      className={`h-8 w-auto ${className}`}
    />
  );
}

export function Wordmark({
  lang,
  surface = "paper",
  size = "sm",
  className = "",
  title = "MAKYN"
}: {
  lang: Lang;
  surface?: Surface;
  size?: Size;
  className?: string;
  title?: string;
}) {
  const sizeClass = size === "lg" ? "h-16" : "h-8";
  return (
    <img
      src={logoSrc(lang, surface)}
      alt={title}
      className={`${sizeClass} w-auto ${className}`}
    />
  );
}
