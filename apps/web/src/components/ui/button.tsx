import { forwardRef, ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--signal)] text-[var(--paper)] hover:bg-[var(--signal-deep)]",
  secondary:
    "bg-transparent text-[var(--ink)] border border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]",
  ghost:
    "bg-transparent text-[var(--ink-80)] hover:bg-[var(--paper-low)]",
  danger:
    "bg-[var(--state-overdue)] text-[var(--paper)] hover:bg-[var(--ink)]",
  // Legacy alias — routes to primary.
  gold: "bg-[var(--signal)] text-[var(--paper)] hover:bg-[var(--signal-deep)]"
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "px-[18px] py-[10px] text-[13px]",
  lg: "h-11 px-6 text-[14px]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[6px] font-semibold tracking-[0.01em] transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-[var(--signal)] focus:ring-offset-2 focus:ring-offset-[var(--paper)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  );
});
