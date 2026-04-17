import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "neutral" | "green" | "yellow" | "red" | "navy" | "gold";

const tones: Record<Variant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  navy: "bg-navy-100 text-navy-700",
  gold: "bg-gold-500/10 text-gold-600 border border-gold-500/30"
};

export function Badge({
  variant = "neutral",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[variant],
        className
      )}
      {...rest}
    />
  );
}

export function StatusDot({ color }: { color: "green" | "yellow" | "red" }) {
  const tone = color === "green" ? "bg-emerald-500" : color === "yellow" ? "bg-amber-500" : "bg-red-500";
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", tone)} aria-hidden />;
}
