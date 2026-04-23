"use client";

import { useEffect, useRef, useState } from "react";

export function NumberTicker({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
  className = "",
  locale = "en-US",
  format = "int"
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: string;
  format?: "int" | "decimal";
}) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef({ from: value, at: 0 });

  useEffect(() => {
    startRef.current = { from: display, at: performance.now() };
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - startRef.current.at;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = startRef.current.from + (value - startRef.current.from) * eased;
      setDisplay(current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted =
    format === "int"
      ? Math.round(display).toLocaleString(locale)
      : display.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className={`num ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
