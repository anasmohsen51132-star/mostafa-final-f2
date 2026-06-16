"use client";
// src/components/ui/Toast.tsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/uiStore";

const ICONS = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
} as const;

const COLORS = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-emerald-dark text-white",
  warning: "bg-amber-500 text-white",
} as const;

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ fontFamily: "Cairo, sans-serif" }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-glass-lg max-w-xs text-sm font-medium cursor-pointer ${COLORS[toast.type]}`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-base">{ICONS[toast.type]}</span>
            <span style={{ direction: "rtl" }}>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
