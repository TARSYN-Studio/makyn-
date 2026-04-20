import { forwardRef, InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg bg-[var(--paper-low)] border px-3 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-40)] focus:outline-none focus:ring-[3px] disabled:pointer-events-none disabled:opacity-60 transition-colors",
        error
          ? "border-[var(--state-overdue)] focus:border-[var(--state-overdue)] focus:ring-[rgba(139, 38, 53, 0.1)]"
          : "border-[var(--stone-light)] focus:border-[var(--signal)] focus:ring-[rgba(30,58,138,0.1)]",
        className
      )}
      {...rest}
    />
  );
});
