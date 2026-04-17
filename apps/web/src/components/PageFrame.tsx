"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Page-level mount animation. Wrap the outermost section of a route
 * to get a single subtle fade+lift when navigating in.
 *
 * Duration intentionally short (<200ms) so perceived page load stays
 * snappy — this is polish, not a parade.
 */
export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
