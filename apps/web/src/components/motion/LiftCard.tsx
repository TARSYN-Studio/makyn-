"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { EASE } from "./ease";

export function LiftCard({
  children,
  onClick,
  className = "",
  tiltMax = 1,
  liftY = -2,
  as: Tag = "div"
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  tiltMax?: number;
  liftY?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, hover: false });

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({
      rx: (0.5 - y) * tiltMax * 2,
      ry: (x - 0.5) * tiltMax * 2,
      hover: true
    });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0, hover: false });

  const Comp = Tag as unknown as React.ElementType;

  return (
    <Comp
      ref={ref as unknown as React.Ref<HTMLElement>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        transform: `perspective(1000px) translateY(${tilt.hover ? liftY : 0}px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: `transform 300ms ${EASE.out}, box-shadow 300ms ${EASE.out}, border-color 300ms ${EASE.std}`,
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
    >
      {children}
    </Comp>
  );
}
