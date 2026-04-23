"use client";

import { useEffect, useState } from "react";
import { EASE } from "./ease";

export function ProgressRing({
  value,
  size = 120,
  stroke = 4,
  color = "var(--signal)",
  trackColor = "var(--stone-light)",
  className = ""
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPct(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset 1200ms ${EASE.out}` }}
      />
    </svg>
  );
}
