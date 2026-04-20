import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & { interactive?: boolean };

export function Card({ className, interactive, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--paper-low)] border border-[var(--stone-light)] rounded-[4px] shadow-card",
        interactive &&
          "hover:border-[var(--stone)] transition-colors duration-150",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 border-b border-[var(--stone-light)]", className)}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 border-t border-[var(--stone-light)]", className)}
      {...rest}
    />
  );
}
