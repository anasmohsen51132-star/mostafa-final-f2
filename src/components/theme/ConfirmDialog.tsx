"use client";
// src/components/theme/ConfirmDialog.tsx
import { useEffect, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel = "تأكيد", danger = true, onConfirm, onCancel,
}: Props) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  // A11Y: focus the safe (cancel) action on open, and let Escape close the
  // dialog — a screen-reader/keyboard-only user previously had no
  // announced way to know a dialog opened or how to dismiss it. Depends
  // only on `open` (via a ref for the latest onCancel) since both current
  // callers pass a fresh inline onCancel on every render.
  useEffect(() => {
    if (!open) return;
    cancelBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(26,18,8,0.55)" }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#fff", direction: "rtl" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? "confirm-dialog-desc" : undefined}
          >
            <h3 id="confirm-dialog-title" style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 18, marginBottom: 8 }}>
              {title}
            </h3>
            {description && (
              <p id="confirm-dialog-desc" style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 20 }}>
                {description}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                ref={cancelBtnRef}
                onClick={onCancel}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(201,168,76,0.3)",
                  background: "transparent", color: "#7A6E5A",
                  fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer",
                }}
              >
                إلغاء
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: "9px 18px", borderRadius: 10, border: "none",
                  background: danger ? "#DC2626" : "linear-gradient(135deg,#C9A84C,#8B6914)",
                  color: "#fff", fontFamily: "Cairo,sans-serif", fontWeight: 700,
                  fontSize: 13, cursor: "pointer",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
