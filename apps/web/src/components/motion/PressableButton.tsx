"use client";

import { useState, type ReactNode } from "react";
import { EASE } from "./ease";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "signal";
type Size = "sm" | "md" | "lg";

export function PressableButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  leading,
  trailing,
  full = false,
  ariaLabel
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  leading?: ReactNode;
  trailing?: ReactNode;
  full?: boolean;
  ariaLabel?: string;
}) {
  const [pressed, setPressed] = useState(false);

  const variants: Record<Variant, string> = {
    primary:
      "bg-[var(--ink)] text-[var(--paper)] border border-[var(--ink)]",
    secondary:
      "bg-[var(--card)] text-[var(--ink)] border border-[var(--stone-light)] hover:border-[var(--ink-40)]",
    ghost:
      "bg-transparent text-[var(--ink-60)] border border-transparent hover:bg-[var(--paper-deep)]",
    danger:
      "bg-[var(--state-overdue)] text-white border border-[var(--state-overdue)]",
    signal:
      "bg-[var(--signal)] text-white border border-[var(--signal)]"
  };
  const sizes: Record<Size, string> = {
    sm: "h-[30px] px-3 text-[12.5px] rounded-md gap-1.5",
    md: "h-[36px] px-4 text-[13px] rounded-md gap-2",
    lg: "h-[44px] px-5 text-[14px] rounded-lg gap-2"
  };

  const lifted =
    variant === "primary" || variant === "signal" || variant === "danger"
      ? "0 1px 2px rgba(14,22,40,0.08), 0 1px 1px rgba(14,22,40,0.04)"
      : "0 1px 1px rgba(14,22,40,0.02)";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-medium select-none ${variants[variant]} ${sizes[size]} ${
        full ? "w-full" : ""
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      style={{
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: `transform 160ms ${EASE.quick}, background-color 200ms ${EASE.std}, border-color 200ms ${EASE.std}, box-shadow 200ms ${EASE.std}`,
        boxShadow: pressed ? "inset 0 1px 2px rgba(0,0,0,0.08)" : lifted,
        WebkitTapHighlightColor: "transparent"
      }}
    >
      {leading}
      <span>{children}</span>
      {trailing}
    </button>
  );
}
