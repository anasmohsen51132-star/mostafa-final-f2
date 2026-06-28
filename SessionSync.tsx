"use client";
// src/components/ui/StatCard.tsx
import { motion, useMotionValue, useTransform, animate as motionAnimate } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  trend?: string;
  color?: "gold" | "emerald" | "blue" | "red";
  delay?: number;
  withAnimation?: boolean;
}

const colorMap = {
  gold:    { bg: "bg-gold/10",    text: "text-gold-dark",  icon: "bg-gold/20" },
  emerald: { bg: "bg-emerald/10", text: "text-emerald",    icon: "bg-emerald/15" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",   icon: "bg-blue-100" },
  red:     { bg: "bg-red-50",     text: "text-red-600",    icon: "bg-red-100" },
};

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString("ar-EG"));
  const [display, setDisplay] = useState("٠");

  useEffect(() => {
    const controls = motionAnimate(count, value, { duration: 1.2, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value, count, rounded]);

  return <span>{display}</span>;
}

export function StatCard({
  icon,
  value,
  label,
  trend,
  color = "gold",
  delay = 0,
  withAnimation = true,
}: StatCardProps) {
  const colors = colorMap[color];
  const isNumber = typeof value === "number";

  return (
    <motion.div
      initial={withAnimation ? { opacity: 0, y: 24, scale: 0.95 } : undefined}
      animate={withAnimation ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn("rounded-2xl p-5 border border-gold/15 shadow-sm", colors.bg)}
      style={{ fontFamily: "Cairo, sans-serif" }}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4", colors.icon)}>
        {icon}
      </div>
      <div className={cn("text-3xl font-bold mb-1", colors.text)}>
        {isNumber ? <AnimatedNumber value={value as number} /> : value}
      </div>
      <div className="text-ink-muted text-sm">{label}</div>
      {trend && (
        <div className="text-emerald text-xs mt-2 font-medium">{trend}</div>
      )}
    </motion.div>
  );
}
