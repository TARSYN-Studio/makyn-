"use client";

import { Children, type ReactNode } from "react";
import { EASE } from "./ease";

export function Stagger({
  children,
  delay = 40,
  start = 0,
  className = ""
}: {
  children: ReactNode;
  delay?: number;
  start?: number;
  className?: string;
}) {
  const items = Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            animation: `stg-in 460ms ${EASE.out} both`,
            animationDelay: `${start + i * delay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
