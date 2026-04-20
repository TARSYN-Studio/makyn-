import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Canonical state taxonomy. All previous aliases (urgent, navy, accent,
// progress, teal, yellow, amber, gold, open, waiting, done, escalated…)
// collapse into these four. Chip shape: tinted background, 2px inline-start
// accent rule, ink text. No filled pills.
type Variant = "neutral" | "signal" | "overdue" | "resolved" | "pending";

const tones: Record<Variant, string> = {
  neutral:
    "bg-[var(--paper-low)] text-[var(--ink-80)] border-s-2 border-[var(--stone)]",
  signal:
    "bg-[var(--signal-tint)] text-[var(--ink)] border-s-2 border-[var(--signal)]",
  overdue:
    "bg-[var(--state-overdue-tint)] text-[var(--ink)] border-s-2 border-[var(--state-overdue)]",
  resolved:
    "bg-[var(--state-resolved-tint)] text-[var(--ink)] border-s-2 border-[var(--state-resolved)]",
  pending:
    "bg-[var(--state-pending-tint)] text-[var(--ink)] border-s-2 border-[var(--state-pending)]"
};

type LegacyVariant =
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

const aliasMap: Record<LegacyVariant, Variant> = {
  green: "resolved",
  done: "resolved",
  yellow: "pending",
  amber: "pending",
  waiting: "pending",
  red: "overdue",
  urgent: "overdue",
  escalated: "overdue",
  navy: "signal",
  accent: "signal",
  gold: "signal",
  teal: "signal",
  progress: "signal",
  open: "signal"
};

type AnyVariant = Variant | LegacyVariant;

function resolveVariant(v: AnyVariant): Variant {
  return (v in tones ? v : aliasMap[v as LegacyVariant] ?? "neutral") as Variant;
}

export function Badge({
  variant = "neutral",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: AnyVariant }) {
  const resolved = resolveVariant(variant);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] ps-2 pe-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.02em]",
        tones[resolved],
        className
      )}
      {...rest}
    />
  );
}

export function StatusDot({ color }: { color: "green" | "yellow" | "red" }) {
  const tone =
    color === "green"
      ? "bg-[var(--state-resolved)]"
      : color === "yellow"
        ? "bg-[var(--state-pending)]"
        : "bg-[var(--state-overdue)]";
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", tone)}
      aria-hidden
    />
  );
}
