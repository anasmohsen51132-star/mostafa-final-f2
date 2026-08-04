"use client";
// src/app/(admin)/admin/codes/page.tsx
import { useState, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { formatDate } from "@/lib/utils";
import type { AccessCode, Course } from "@/types";
import { ACADEMIC_LEVEL_LABELS } from "@/types";

// Egyptian academic year runs Sept→June. Sept or later this year = "this/next";
// before Sept = "last/this" — same convention students already see elsewhere.
function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

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
  const [page, setPage] = useState(1);
  const CODES_PAGE_SIZE = 50;

  const { data: codesRes, isLoading } = useQuery({
    queryKey: ["admin-codes", page],
    queryFn:  () => fetchWithAuth(`/api/codes?page=${page}&limit=${CODES_PAGE_SIZE}`),
  });
  const { data: coursesRes } = useQuery({
    queryKey: ["all-courses"],
    queryFn:  () => fetchWithAuth("/api/courses"),
  });

  const codes:   AccessCode[] = codesRes?.data?.codes   ?? [];
  const totalCodes: number = codesRes?.data?.total ?? codes.length;
  const totalPages = Math.max(1, Math.ceil(totalCodes / CODES_PAGE_SIZE));
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
        setPage(1);
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
      const res = await fetch("/api/export/codes", { credentials: "same-origin" });
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
        className="flex items-start justify-between mb-8 flex-wrap gap-4 no-print">
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
            كودات الوصول
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {totalCodes} كود إجمالاً &nbsp;·&nbsp;
            <span style={{ color: "#2D9E6B" }}>{availCount} متاح</span> &nbsp;·&nbsp;
            <span style={{ color: "#DC2626" }}>{usedCount} مستخدم</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Excel export */}
          <button
            onClick={handleExcelExport}
            disabled={isExporting || totalCodes === 0}
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
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Toolbar — marked no-print. IMPORTANT: this box must stay a
                SIBLING of the print grid below, never an ancestor of it —
                hiding an ancestor hides every child regardless of the
                child's own display rules, which was the root cause of the
                original "prints blank" bug. */}
            <div className="rounded-2xl p-6 mb-8 no-print"
              style={{ background: "rgba(45,158,107,0.05)", border: "1px solid rgba(45,158,107,0.25)" }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
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
            </div>

            {/* Print grid — sits outside the no-print toolbar box above, so
                it prints on its own with no decorative background/border
                eating into the page. Cards are landscape (matches the
                reference template's ~3:2 ratio) so 2 fit per row on A4;
                fewer codes per sheet than a small recharge-card grid, but
                this is the fidelity that was actually asked for. */}
            <div ref={printRef} id="codes-print-grid"
              className="grid gap-4 mb-8"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
              {newCodes.map((c) => {
                const primaryCourse = c.courses?.[0]?.course;
                const courseTitle   = c.courses?.map((cc) => cc.course.title).join("، ") ?? "";
                // Level comes straight from the course being printed — never
                // asked for separately, exactly as requested: whoever is
                // generating codes for a course already knows/set which
                // academic year(s) that course belongs to.
                const levels = primaryCourse?.levels ?? [];
                const levelLabel =
                  levels.length === 1 ? ACADEMIC_LEVEL_LABELS[levels[0].academicLevel]
                  : levels.length > 1 ? levels.map((l) => ACADEMIC_LEVEL_LABELS[l.academicLevel]).join(" / ")
                  : null;

                return (
                  <div key={c.id} className="code-card-print" style={{
                    position: "relative", overflow: "hidden", borderRadius: 18,
                    background: "linear-gradient(145deg,#0D3D27 0%,#123F28 55%,#1A6B47 100%)",
                    border: "2.5px solid #C9A84C",
                    boxShadow: "0 4px 14px rgba(13,61,39,0.25)",
                    aspectRatio: "1280 / 827",
                    // LTR wrapper purely for flex item ORDER (text left,
                    // photo right) — Arabic text inside still shapes RTL
                    // normally, only the block-level layout direction
                    // changes. Using this instead of RTL row-reverse
                    // sidesteps browser inconsistencies mixing the two.
                    direction: "ltr", display: "flex",
                  }}>
                    {/* Decorative corner flourish, top-left of the whole card */}
                    <div style={{
                      position: "absolute", top: -30, left: -30, width: 110, height: 110,
                      borderRadius: "50%", border: "2px solid rgba(201,168,76,0.35)",
                    }} />
                    <div style={{
                      position: "absolute", top: -10, left: -10, width: 70, height: 70,
                      borderRadius: "50%", border: "1.5px solid rgba(201,168,76,0.3)",
                    }} />

                    {/* Text column */}
                    <div style={{
                      position: "relative", zIndex: 1, flex: "1 1 60%",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", textAlign: "center", padding: "5% 4%",
                    }}>
                      <div style={{
                        width: 26, height: 26, marginBottom: 4, borderRadius: "50% 50% 50% 0",
                        background: "rgba(201,168,76,0.18)", border: "1.3px solid rgba(201,168,76,0.55)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transform: "rotate(45deg)",
                      }}>
                        <span style={{ transform: "rotate(-45deg)", fontSize: 12 }}>🕌</span>
                      </div>

                      <div style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 18, fontWeight: 700, marginBottom: 6, lineHeight: 1.25 }}>
                        أكاديمية مستر مصطفى
                      </div>

                      {levelLabel && (
                        <div style={{
                          display: "inline-block", padding: "3px 14px", borderRadius: 999,
                          background: "rgba(201,168,76,0.15)", border: "1px solid rgba(232,201,122,0.5)", color: "#E8C97A",
                          fontFamily: "Cairo,sans-serif", fontSize: 10, fontWeight: 700, marginBottom: 7,
                        }}>
                          {levelLabel}
                        </div>
                      )}

                      <div style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontSize: 10, opacity: 0.85 }}>
                        كود الطالب
                      </div>
                      <div style={{
                        fontFamily: "Cairo,sans-serif", color: "#fff", fontSize: 10,
                        marginBottom: 7, padding: "2px 10px", borderRadius: 999,
                        background: "rgba(0,0,0,0.15)", border: "1px solid rgba(232,201,122,0.25)",
                      }}>
                        كود {courseTitle}
                      </div>

                      <div style={{ background: "#FAF7F0", borderRadius: 9, padding: "6% 5%", marginBottom: 6, width: "88%", border: "1px solid rgba(201,168,76,0.4)" }}>
                        <p style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#1A1208", letterSpacing: "0.05em" }}>
                          {c.code}
                        </p>
                      </div>

                      <div style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontSize: 9, opacity: 0.85 }}>
                        السنة الدراسية {currentAcademicYear()}
                      </div>
                      {c.expiresAt && (
                        <p style={{ fontFamily: "Cairo,sans-serif", fontSize: 8, color: "#F5B5B5", marginTop: 2 }}>
                          ينتهي: {new Date(c.expiresAt).toLocaleDateString("ar-EG")}
                        </p>
                      )}
                      <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(232,201,122,0.7)", fontSize: 8, marginTop: 3 }}>
                        نسير على نهج العلم والإتقان
                      </div>
                    </div>

                    {/* Photo panel — fixed-width column with a real height
                        (100% of the card's own aspect-ratio-driven height),
                        so object-fit has an actual box to fit into instead
                        of a percentage of an undefined auto height — that
                        undefined-height case is what made the photo render
                        tiny/broken in the previous version. */}
                    <div style={{ position: "relative", flex: "0 0 42%", height: "100%" }}>
                      <img
                        src="/mostafa-portrait.png"
                        alt=""
                        style={{
                          position: "absolute", inset: 0, width: "100%", height: "100%",
                          objectFit: "cover", objectPosition: "top center",
                        }}
                      />
                      {/* Fade the photo's bottom into the card background so
                          the cutout edge doesn't look like a hard sticker. */}
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to left, transparent 70%, #0D3D27 100%)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Codes table */}
      <div className="no-print">
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

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap" style={{ direction: "ltr" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)",
              background: "transparent", color: page === 1 ? "rgba(122,110,90,0.4)" : "#7A6E5A",
              fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: page === 1 ? "default" : "pointer",
            }}
          >
            ‹ السابق
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} style={{ color: "#7A6E5A", fontFamily: "Cairo,sans-serif", fontSize: 13, padding: "0 4px" }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    minWidth: 34, padding: "6px 8px", borderRadius: 8,
                    border: p === page ? "none" : "1px solid rgba(201,168,76,0.3)",
                    background: p === page ? "linear-gradient(135deg,#C9A84C,#8B6914)" : "transparent",
                    color: p === page ? "#1A1208" : "#7A6E5A",
                    fontFamily: "Cairo,sans-serif", fontSize: 13, fontWeight: p === page ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)",
              background: "transparent", color: page === totalPages ? "rgba(122,110,90,0.4)" : "#7A6E5A",
              fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: page === totalPages ? "default" : "pointer",
            }}
          >
            التالي ›
          </button>
        </div>
      )}
      </div>
      {/* end no-print table/pagination wrapper */}
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
                        <span style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, flex: 1, minWidth: 0, fontWeight: sel ? 700 : 400 }}>
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
              <div className="flex gap-4 mb-4 flex-wrap">
                <div style={{ flex: 1, minWidth: 140 }}>
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
                <div style={{ flex: 1, minWidth: 140 }}>
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
