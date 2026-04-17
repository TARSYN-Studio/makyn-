/* eslint-disable @next/next/no-img-element */
// Plain <img> is intentional — we want the page to render even if
// /logo.png is missing (no next/image build-time optimization pass).

type Size = "sm" | "lg";

export function LogoMark({
  className = "",
  title = "MAKYN"
}: {
  className?: string;
  title?: string;
}) {
  // Icon-scale usage: default 32px tall, native aspect ratio preserved.
  return (
    <img
      src="/logo.png"
      alt={title}
      className={`h-8 w-auto ${className}`}
      style={{ width: "auto" }}
    />
  );
}

export function Wordmark({
  className = "",
  size = "sm",
  title = "MAKYN"
}: {
  className?: string;
  size?: Size;
  title?: string;
}) {
  const sizeClass = size === "lg" ? "h-16" : "h-8";
  return (
    <img
      src="/logo.png"
      alt={title}
      className={`${sizeClass} w-auto ${className}`}
      style={{ width: "auto" }}
    />
  );
}
