"use client";
// src/app/(admin)/admin/codes/page.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { formatDate } from "@/lib/utils";
import type { AccessCode, Course } from "@/types";

export default function AdminCodesPage() {
  const toast    = useToast();
  const qc       = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [showGenerator,    setShowGenerator]    = useState(false);
  const [selectedCourses,  setSelectedCourses]  = useState<string[]>([]);
  const [count,            setCount]            = useState(10);
  const [expiresAt,        setExpiresAt]        = useState("");
  const [note,             setNote]             = useState("");
  const [newCodes,         setNewCodes]         = useState<AccessCode[]>([]);
  const [showPrint,        setShowPrint]        = useState(false);
  const [isExporting,      setIsExporting]      = useState(false);

  const { data: codesRes, isLoading } = useQuery({
    queryKey: ["admin-codes"],
    queryFn:  () => fetchWithAuth("/api/codes?limit=200"),
  });
  const { data: coursesRes } = useQuery({
    queryKey: ["all-courses"],
    queryFn:  () => fetchWithAuth("/api/courses"),
  });

  const codes:   AccessCode[] = codesRes?.data?.codes   ?? [];
  const courses: Course[]     = coursesRes?.data         ?? [];

  const generateMutation = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/codes", {
        method: "POST",
        body: JSON.stringify({
          courseIds: selectedCourses, count,
          expiresAt: expiresAt || null,
          note:      note || undefined,
        }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`✅ تم توليد ${res.data.count} كود`);
        setNewCodes(res.data.codes);
        setShowPrint(true);
        setShowGenerator(false);
        qc.invalidateQueries({ queryKey: ["admin-codes"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      } else {
        toast.error(res.error ?? "فشل التوليد");
      }
    },
  });

  const handleGenerate = () => {
    if (selectedCourses.length === 0) { toast.error("اختر كورساً واحداً على الأقل"); return; }
    if (count < 1 || count > 500)     { toast.error("العدد يجب أن يكون بين 1 و 500"); return; }
    generateMutation.mutate();
  };

  const handlePrint = () => window.print();

  // ── Excel export ──────────────────────────────────────────
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/codes", {
        headers: {
          Authorization: `Bearer ${
            (() => {
              try {
                const raw = localStorage.getItem("mustafa-auth");
                if (!raw) return "";
                return JSON.parse(raw)?.state?.token ?? "";
              } catch { return ""; }
            })()
          }`,
        },
      });
      if (!res.ok) { toast.error("فشل التصدير"); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `codes-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("✅ تم تصدير الكودات إلى Excel");
    } catch {
      toast.error("حدث خطأ أثناء التصدير");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCourse = (id: string) =>
    setSelectedCourses((p) =>
      p.includes(id) ? p.filter((c) => c !== id) : [...p, id]
    );

  const usedCount  = codes.filter((c) => c.usedBy).length;
  const availCount = codes.filter((c) => !c.usedBy).length;

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
            كودات الوصول
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {codes.length} كود إجمالاً &nbsp;·&nbsp;
            <span style={{ color: "#2D9E6B" }}>{availCount} متاح</span> &nbsp;·&nbsp;
            <span style={{ color: "#DC2626" }}>{usedCount} مستخدم</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Excel export */}
          <button
            onClick={handleExcelExport}
            disabled={isExporting || codes.length === 0}
            style={{
              padding: "10px 20px", borderRadius: 12,
              border: "1.5px solid rgba(45,158,107,0.35)",
              background: "rgba(45,158,107,0.06)",
              color: "#1A6B47", fontFamily: "Cairo,sans-serif",
              fontWeight: 700, fontSize: 13, cursor: isExporting ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {isExporting ? "⏳ جارٍ التصدير..." : "📊 تصدير Excel"}
          </button>
          {/* Generate */}
          <button
            onClick={() => setShowGenerator(true)}
            style={{
              padding: "10px 24px", borderRadius: 12,
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
              color: "#1A1208", fontFamily: "Cairo,sans-serif",
              fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
            }}
          >
            🎟️ توليد كودات
          </button>
        </div>
      </motion.div>

      {/* New codes print section */}
      <AnimatePresence>
        {showPrint && newCodes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-6 mb-8"
            style={{ background: "rgba(45,158,107,0.05)", border: "1px solid rgba(45,158,107,0.25)" }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A6B47", fontSize: 20 }}>
                ✅ تم توليد {newCodes.length} كود جديد
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrint}
                  style={{ padding: "8px 18px", borderRadius: 10,
                    background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif",
                    fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                  🖨️ طباعة الكودات
                </button>
                <button onClick={() => setShowPrint(false)}
                  style={{ padding: "8px 14px", borderRadius: 10,
                    border: "1px solid rgba(201,168,76,0.3)", color: "#8B6914",
                    background: "none", fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer" }}>
                  إغلاق
                </button>
              </div>
            </div>
            {/* Print grid */}
            <div ref={printRef}
              className="grid gap-3 no-print"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {newCodes.map((c) => (
                <div key={c.id} className="rounded-xl p-4 text-center code-card-print"
                  style={{ background: "#fff", border: "2px solid rgba(201,168,76,0.3)",
                    boxShadow: "0 2px 8px rgba(26,18,8,0.06)" }}>
                  <div style={{ fontFamily: "Amiri,serif", color: "#C9A84C", fontSize: 10, marginBottom: 5, fontWeight: 700 }}>
                    اكاديمية مستر مصطفى
                  </div>
                  <div style={{ height: 1, background: "rgba(201,168,76,0.25)", marginBottom: 6 }} />
                  <div style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 9, marginBottom: 6, lineHeight: 1.4 }}>
                    {c.courses?.map((cc) => cc.course.title).join("، ")}
                  </div>
                  <div style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", borderRadius: 6, padding: "6px 4px", marginBottom: 6 }}>
                    <p style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#E8C97A", letterSpacing: "0.1em" }}>
                      {c.code}
                    </p>
                  </div>
                  {c.expiresAt && (
                    <p style={{ fontFamily: "Cairo,sans-serif", fontSize: 8, color: "#DC2626", marginTop: 4 }}>
                      ينتهي: {new Date(c.expiresAt).toLocaleDateString("ar-EG")}
                    </p>
                  )}
                  <p style={{ fontFamily: "Cairo,sans-serif", fontSize: 7, color: "#7A6E5A", marginTop: 4, lineHeight: 1.4 }}>
                    يُستخدم مرة واحدة فقط
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Codes table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}
        </div>
      ) : codes.length > 0 ? (
        <div className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr style={{ background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                {["الكود", "الكورسات", "الحالة", "تاريخ الإنشاء", "الانتهاء"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "right",
                    fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <motion.tr key={c.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ borderBottom: "1px solid rgba(201,168,76,0.07)", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.025)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "monospace", color: "#1A1208", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                      {c.code}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>
                      {c.courses?.map((cc) => `${cc.course.icon} ${cc.course.title}`).join("، ")}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 20,
                      fontSize: 11, fontWeight: 700, fontFamily: "Cairo,sans-serif",
                      background: c.usedBy ? "rgba(239,68,68,0.08)" : "rgba(45,158,107,0.1)",
                      color: c.usedBy ? "#DC2626" : "#1A6B47",
                    }}>
                      {c.usedBy ? `مستخدم — ${c.usedBy.name}` : "✅ متاح"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                      {formatDate(c.createdAt)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 12,
                      color: c.expiresAt ? "#DC2626" : "#7A6E5A" }}>
                      {c.expiresAt ? formatDate(c.expiresAt) : "بلا تاريخ"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎟️</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22 }}>لا توجد كودات بعد</h3>
        </div>
      )}

      {/* Generator modal */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowGenerator(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl p-7 w-full max-h-[90vh] overflow-y-auto"
              style={{ background: "#fff", direction: "rtl", maxWidth: 480 }}>
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 20 }}>
                توليد كودات جديدة
              </h2>

              {/* Courses */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>
                  الكورسات التي تفتحها الكودات *
                </label>
                <div className="space-y-2">
                  {courses.map((course) => {
                    const sel = selectedCourses.includes(course.id);
                    return (
                      <button key={course.id} type="button" onClick={() => toggleCourse(course.id)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-right transition-all"
                        style={{ border: "1.5px solid", borderColor: sel ? "#C9A84C" : "rgba(201,168,76,0.2)",
                          background: sel ? "rgba(201,168,76,0.08)" : "transparent", cursor: "pointer" }}>
                        <span style={{ fontSize: 20 }}>{course.icon}</span>
                        <span style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, flex: 1, fontWeight: sel ? 700 : 400 }}>
                          {course.title}
                        </span>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid",
                          borderColor: sel ? "#C9A84C" : "rgba(201,168,76,0.3)",
                          background: sel ? "#C9A84C" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 11, flexShrink: 0 }}>
                          {sel ? "✓" : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count + Expiry */}
              <div className="flex gap-4 mb-4">
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" }}>
                    عدد الكودات (1–500)
                  </label>
                  <input type="number" min="1" max="500" value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
                      color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 14,
                      outline: "none", direction: "ltr" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" }}>
                    تاريخ الانتهاء (اختياري)
                  </label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
                      color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 14,
                      outline: "none", direction: "ltr" }} />
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" }}>
                  ملاحظة (اختياري)
                </label>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: دفعة يناير 2025"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10,
                    border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 13,
                    outline: "none", direction: "rtl" }} />
              </div>

              <div className="flex gap-3">
                <button onClick={handleGenerate} disabled={generateMutation.isPending}
                  style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif",
                    fontWeight: 700, fontSize: 14,
                    cursor: generateMutation.isPending ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(201,168,76,0.35)" }}>
                  {generateMutation.isPending ? "⏳ جارٍ التوليد..." : `🎟️ توليد ${count} كود`}
                </button>
                <button onClick={() => setShowGenerator(false)}
                  style={{ padding: "13px 18px", borderRadius: 12,
                    border: "1px solid rgba(201,168,76,0.3)", background: "none",
                    color: "#8B6914", fontFamily: "Cairo,sans-serif",
                    fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
