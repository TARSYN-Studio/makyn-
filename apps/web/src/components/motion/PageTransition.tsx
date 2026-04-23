"use client";

import type { ReactNode } from "react";
import { EASE } from "./ease";

export function PageTransition({
  routeKey,
  children
}: {
  routeKey: string;
  children: ReactNode;
}) {
  return (
    <div
      key={routeKey}
      style={{
        animation: `pg-in 460ms ${EASE.out} both`
      }}
    >
      {children}
    </div>
  );
}
