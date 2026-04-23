"use client";

import type { ReactNode } from "react";
import { EASE } from "./ease";

export function MagneticLink({
  children,
  onClick,
  href,
  className = "",
  isRtl = false
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  isRtl?: boolean;
}) {
  const inner = (
    <span className="relative">
      {children}
      <span
        className="absolute left-0 right-0 bottom-[-2px] h-px bg-current origin-left scale-x-0 group-hover:scale-x-100"
        style={{
          transition: `transform 360ms ${EASE.out}`,
          transformOrigin: isRtl ? "right" : "left"
        }}
      />
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`relative inline-flex items-baseline group ${className}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-baseline group ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {inner}
    </button>
  );
}
