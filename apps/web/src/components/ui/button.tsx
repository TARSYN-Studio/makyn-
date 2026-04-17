import { forwardRef, ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-navy-500 text-white hover:bg-navy-600 focus:ring-navy-400",
  secondary: "bg-white border border-navy-200 text-navy-700 hover:bg-navy-50 focus:ring-navy-400",
  ghost: "bg-transparent text-navy-700 hover:bg-navy-50 focus:ring-navy-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
  gold: "bg-gold-500 text-white hover:bg-gold-600 focus:ring-gold-400"
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base"
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
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  );
});
