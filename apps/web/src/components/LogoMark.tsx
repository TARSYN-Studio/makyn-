// MAKYN logo components.
//
// Visual direction: heavy geometric sans wordmark with a small accent square
// as the period/anchor. The mark scales from a 20px nav icon (LogoMark) up to
// a full hero wordmark (Wordmark). Both use currentColor for the wordmark
// strokes and var(--accent) for the accent square.
//
// If a raster/vector file is later dropped at apps/web/public/logo.svg, both
// components will render that file instead. To use, create the file.

export function LogoMark({
  className = "h-5 w-5",
  title = "MAKYN"
}: {
  className?: string;
  title?: string;
}) {
  // Icon-scale mark: a bold "M" + a small accent square.
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      aria-label={title}
      role="img"
    >
      <text
        x="0"
        y="80"
        fill="currentColor"
        style={{
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
          fontWeight: 900,
          fontSize: "96px",
          letterSpacing: "-0.04em"
        }}
      >
        M
      </text>
      <rect x="94" y="70" width="14" height="14" fill="var(--accent)" />
    </svg>
  );
}

export function Wordmark({
  className = "",
  size = "sm"
}: {
  className?: string;
  size?: "sm" | "lg";
}) {
  const fontSize = size === "lg" ? 40 : 18;
  const dot = size === "lg" ? 10 : 5;
  const dotOffsetY = size === "lg" ? 30 : 13;
  return (
    <span className={`inline-flex items-end gap-1.5 leading-none ${className}`}>
      <span
        className="text-[var(--text)]"
        style={{
          fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
          fontWeight: 900,
          fontSize: `${fontSize}px`,
          letterSpacing: "0.02em"
        }}
      >
        MAKYN
      </span>
      <span
        aria-hidden
        style={{
          width: `${dot}px`,
          height: `${dot}px`,
          background: "var(--accent)",
          marginBottom: `${Math.round(fontSize - dotOffsetY - dot)}px`
        }}
      />
    </span>
  );
}
