import { forwardRef, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, rows = 4, error, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-md bg-[var(--card)] border px-3 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-[3px] disabled:pointer-events-none disabled:opacity-60 transition-colors",
        error
          ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-[rgba(185,28,28,0.1)]"
          : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-[rgba(30,58,138,0.1)]",
        className
      )}
      {...rest}
    />
  );
});
