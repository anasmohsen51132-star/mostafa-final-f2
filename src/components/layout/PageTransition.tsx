"use client";
// src/components/layout/PageTransition.tsx
import { m as motion } from "framer-motion";

const springBouncy = { type: "spring", stiffness: 260, damping: 18 } as const;

// Stagger container — longer per-child delay so the sequence actually
// reads as a sequence instead of everything arriving almost at once.
export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger item — bigger offset + a hint of scale, with a springy settle.
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 32, scale: 0.94 },
        visible: { opacity: 1, y: 0, scale: 1, transition: springBouncy },
      }}
    >
      {children}
    </motion.div>
  );
}
