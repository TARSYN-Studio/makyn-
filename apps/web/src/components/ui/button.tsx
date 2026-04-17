import { forwardRef, ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-mid)] active:scale-[0.98] focus:border-[var(--accent)]",
  secondary:
    "bg-transparent text-[var(--text-mid)] border border-[var(--border)] hover:bg-[var(--surface)] focus:border-[var(--accent)]",
  ghost:
    "bg-transparent text-[var(--text-mid)] hover:bg-[var(--surface)] focus:border-[var(--accent)]",
  danger:
    "bg-[var(--red)] text-white hover:brightness-110 focus:border-[var(--red)]",
  // Legacy alias — "gold" used to mean a warm accent; route to primary.
  gold: "bg-[var(--accent)] text-white hover:bg-[var(--accent-mid)] active:scale-[0.98]"
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
        "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-[120ms] focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,138,0.1)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  );
});
