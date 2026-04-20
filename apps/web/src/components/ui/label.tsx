import { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-[13px] font-medium text-[var(--ink-60)] mb-1",
        className
      )}
      {...rest}
    />
  );
}
