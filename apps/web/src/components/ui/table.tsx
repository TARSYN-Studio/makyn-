import { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse bg-[var(--paper-low)] text-[14px]",
          className
        )}
        {...rest}
      />
    </div>
  );
}

export function Thead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-[var(--paper-low)]", className)}
      {...rest}
    />
  );
}

export function Tbody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("", className)} {...rest} />;
}

export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--stone-light)] transition-colors",
        className
      )}
      {...rest}
    />
  );
}

export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-start text-[11px] font-medium uppercase tracking-wider text-[var(--ink-40)]",
        className
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-3 text-[14px] text-[var(--ink)]", className)}
      {...rest}
    />
  );
}
