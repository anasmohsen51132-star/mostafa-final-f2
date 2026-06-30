"use client";
// src/app/(student)/redeem/page.tsx
import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import type { Course } from "@/types";

interface RedeemResult {
  courses: Course[];
  message: string;
}

export default function RedeemPage() {
  const [code, setCode]         = useState("");
  const [result, setResult]     = useState<RedeemResult | null>(null);
  const toast                   = useToast();
  const qc                      = useQueryClient();

  const mutation = useMutation({
    mutationFn: (c: string) =>
      fetchWithAuth("/api/codes/redeem", {
        method: "POST",
        body: JSON.stringify({ code: c.trim().toUpperCase() }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        setResult(res.data);
        qc.invalidateQueries({ queryKey: ["my-courses"] });
        qc.invalidateQueries({ queryKey: ["courses"] });
        toast.success("🎉 " + res.data.message);
      } else {
        toast.error(res.error ?? "الكود غير صحيح");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { toast.error("أدخل الكود"); return; }
    mutation.mutate(code);
  };

  // Format code as user types: XXXX-XXXX-XX
  const handleCodeChange = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let formatted = "";
    for (let i = 0; i < clean.length && i < 10; i++) {
      if (i === 4 || i === 8) formatted += "-";
      formatted += clean[i];
    }
    setCode(formatted);
  };

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 18 }}
            style={{ fontSize: 72, marginBottom: 12 }}
          >
            🎟️
          </motion.div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 8 }}>
            استخدام كود الوصول
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 15, lineHeight: 1.7 }}>
            أدخل الكود الذي حصلت عليه لفتح الكورس المرتبط به
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-3xl p-8"
              style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.2)", boxShadow: "0 8px 32px rgba(26,18,8,0.08)" }}
            >
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label
                    htmlFor="code"
                    style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13, marginBottom: 8, display: "block", fontWeight: 600 }}
                  >
                    كود الوصول
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="XXXX-XXXX-XX"
                    maxLength={12}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      borderRadius: 14,
                      border: "2px solid rgba(201,168,76,0.3)",
                      background: "rgba(250,247,240,0.5)",
                      color: "#1A1208",
                      fontFamily: "monospace",
                      fontSize: 22,
                      textAlign: "center",
                      letterSpacing: "0.15em",
                      outline: "none",
                      direction: "ltr",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.3)")}
                  />
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                    الكود مؤلف من 10 أحرف وأرقام
                  </p>
                </div>

                <motion.button
                  type="submit"
                  disabled={mutation.isPending || !code.trim()}
                  whileHover={!mutation.isPending ? { y: -2 } : {}}
                  whileTap={!mutation.isPending ? { scale: 0.98 } : {}}
                  style={{
                    width: "100%", padding: "15px", borderRadius: 14, border: "none",
                    background: mutation.isPending || !code.trim()
                      ? "rgba(201,168,76,0.3)"
                      : "linear-gradient(135deg,#C9A84C,#8B6914)",
                    boxShadow: !mutation.isPending && code.trim() ? "0 6px 20px rgba(201,168,76,0.4)" : "none",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif",
                    fontWeight: 700, fontSize: 16,
                    cursor: mutation.isPending || !code.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {mutation.isPending ? "⏳ جارٍ التحقق..." : "🔓 تفعيل الكود"}
                </motion.button>
              </form>

              {/* Help text */}
              <div
                className="mt-6 p-4 rounded-2xl"
                style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.75 }}>
                  💡 <strong>كيف تحصل على كود؟</strong><br />
                  اشتري كوداً من الأستاذ مباشرةً وسيعطيك كارت أو ورقة تحتوي على الكود
                </p>
              </div>
            </motion.div>
          ) : (
            /* Success state */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="rounded-3xl p-8 text-center"
              style={{ background: "#fff", border: "1px solid rgba(45,158,107,0.3)", boxShadow: "0 8px 32px rgba(26,18,8,0.08)" }}
            >
              {/* Confetti-like emoji burst */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                style={{ fontSize: 72, marginBottom: 12 }}
              >
                🎉
              </motion.div>

              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A6B47", fontSize: 32, marginBottom: 8 }}>
                تم التفعيل بنجاح!
              </h2>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 15, marginBottom: 24 }}>
                {result.message}
              </p>

              {/* Unlocked courses */}
              <div className="space-y-3 mb-8 text-right">
                {result.courses.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "rgba(45,158,107,0.06)", border: "1px solid rgba(45,158,107,0.2)" }}
                  >
                    <span style={{ fontSize: 24 }}>{c.icon}</span>
                    <div>
                      <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700 }}>
                        {c.title}
                      </p>
                      <p style={{ fontFamily: "Cairo,sans-serif", color: "#2D9E6B", fontSize: 12 }}>
                        ✅ تم الفتح
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Link
                  href="/my-courses"
                  style={{
                    padding: "12px 32px", borderRadius: 14,
                    background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif",
                    fontWeight: 700, fontSize: 15, textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  📚 عرض كورساتي
                </Link>
                <button
                  onClick={() => { setResult(null); setCode(""); }}
                  style={{
                    padding: "12px 24px", borderRadius: 14,
                    border: "1px solid rgba(201,168,76,0.3)",
                    background: "transparent", color: "#8B6914",
                    fontFamily: "Cairo,sans-serif", fontWeight: 600,
                    fontSize: 15, cursor: "pointer",
                  }}
                >
                  تفعيل كود آخر
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
