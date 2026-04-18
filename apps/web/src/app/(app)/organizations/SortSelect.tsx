"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type SortKey = "activity" | "name" | "issues" | "newest";

type CarryParams = {
  filter?: string;
  view?: string;
  q?: string;
};

type Props = {
  value: SortKey;
  options: Array<{ key: SortKey; label: string }>;
  carry: CarryParams;
};

function buildHref(sort: SortKey, carry: CarryParams): string {
  const qs = new URLSearchParams();
  if (carry.filter && carry.filter !== "all") qs.set("filter", carry.filter);
  if (sort !== "activity") qs.set("sort", sort);
  if (carry.view && carry.view !== "grid") qs.set("view", carry.view);
  if (carry.q) qs.set("q", carry.q);
  const s = qs.toString();
  return `/organizations${s ? `?${s}` : ""}`;
}

export function SortSelect({ value, options, carry }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as SortKey;
        if (next === value) return;
        startTransition(() => {
          router.push(buildHref(next, carry));
        });
      }}
      className="rounded-lg bg-[var(--card)] border border-[var(--border)] px-2 py-1.5 text-[13px] text-[var(--text-mid)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(30,58,138,0.1)] focus:border-[var(--accent)] disabled:opacity-60"
    >
      {options.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
