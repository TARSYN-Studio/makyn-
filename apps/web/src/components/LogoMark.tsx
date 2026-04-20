/* eslint-disable @next/next/no-img-element */
// Plain <img> so the page renders even if the SVG asset is missing —
// no next/image build-time optimisation pass.
//
// `block` kills the baseline-descender whitespace that an inline <img>
// carries by default, which previously clipped the top of the glyphs
// when the nav container was tight.

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
      className={`block h-10 w-auto ${className}`}
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
  // sm is the nav/header lockup — bumped to 40px so the glyphs have
  // enough device pixels to render without the top stroke clipping.
  // lg remains 64px for the login / landing hero lockup.
  const sizeClass = size === "lg" ? "h-16" : "h-10";
  return (
    <img
      src={logoSrc(lang, surface)}
      alt={title}
      className={`block ${sizeClass} w-auto ${className}`}
    />
  );
}
