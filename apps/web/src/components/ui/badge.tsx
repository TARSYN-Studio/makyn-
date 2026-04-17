import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant =
  | "neutral"
  | "green"
  | "yellow"
  | "amber"
  | "red"
  | "navy"
  | "accent"
  | "gold"
  | "teal"
  | "progress"
  | "open"
  | "urgent"
  | "waiting"
  | "done"
  | "escalated";

const tones: Record<Variant, string> = {
  neutral: "bg-[var(--surface)] text-[var(--text-mid)]",
  // Status tones
  urgent: "bg-[var(--red-l)] text-[var(--red)]",
  red: "bg-[var(--red-l)] text-[var(--red)]",
  open: "bg-[var(--accent-l)] text-[var(--accent)]",
  navy: "bg-[var(--accent-l)] text-[var(--accent)]",
  accent: "bg-[var(--accent-l)] text-[var(--accent)]",
  progress: "bg-[var(--teal-l)] text-[var(--teal)]",
  teal: "bg-[var(--teal-l)] text-[var(--teal)]",
  waiting: "bg-[var(--amber-l)] text-[var(--amber)]",
  yellow: "bg-[var(--amber-l)] text-[var(--amber)]",
  amber: "bg-[var(--amber-l)] text-[var(--amber)]",
  done: "bg-[var(--green-l)] text-[var(--green)]",
  green: "bg-[var(--green-l)] text-[var(--green)]",
  escalated:
    "bg-[var(--red-l)] text-[var(--red)] border border-[rgba(185,28,28,0.3)]",
  // Legacy alias
  gold: "bg-[var(--accent-l)] text-[var(--accent)]"
};

export function Badge({
  variant = "neutral",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium",
        tones[variant],
        className
      )}
      {...rest}
    />
  );
}

export function StatusDot({ color }: { color: "green" | "yellow" | "red" }) {
  const tone =
    color === "green"
      ? "bg-[var(--green)]"
      : color === "yellow"
        ? "bg-[var(--amber)]"
        : "bg-[var(--red)]";
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full", tone)}
      aria-hidden
    />
  );
}
