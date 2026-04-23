"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE } from "./ease";

export function Reveal({
  children,
  delay = 0,
  y = 12,
  className = ""
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 640ms ${EASE.out} ${delay}ms, transform 640ms ${EASE.out} ${delay}ms`
      }}
    >
      {children}
    </div>
  );
}
