"use client";
// src/components/theme/ConfirmDialog.tsx
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
          >
            <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 18, marginBottom: 8 }}>
              {title}
            </h3>
            {description && (
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 20 }}>
                {description}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
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
