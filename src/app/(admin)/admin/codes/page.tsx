"use client";
// src/app/(admin)/admin/codes/page.tsx
import { useState, useRef, useMemo, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { formatDate } from "@/lib/utils";
import type { AccessCode, Course } from "@/types";
import {
  toPrintCards, chunkIntoPages, currentAcademicYear, triggerPrint, generatePrintTitle,
  CARD_LAYOUT, type PrintCard,
} from "@/lib/print-codes";

type PrintMode = "batch" | "selected" | "single";

const GOLD = "#C9A84C", GOLD_LIGHT = "#E8C97A", GREEN_DEEP = "#0D3D27", GREEN = "#1A6B47";

/** Purely decorative corner ornament + faint star-lattice background,
 *  adapted from the reviewed module's IslamicPattern.tsx: vector-only (no
 *  raster image) so it stays crisp at 300dpi print, and every internal id
 *  is seeded with the card's own id so a full sheet of 10 cards never
 *  produces duplicate SVG ids in the DOM. viewBox units are 0.1mm, so 1
 *  unit maps 1:1 to the physical 85mm x 55mm card. */
function CardPattern({ cardId }: { cardId: string }) {
  const patternId = `code-card-lattice-${cardId}`;
  return (
    <svg viewBox="0 0 850 550" preserveAspectRatio="none" aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <pattern id={patternId} width="70" height="70" patternUnits="userSpaceOnUse">
          <g stroke={GOLD_LIGHT} fill="none" strokeWidth="1">
            <rect x="10" y="10" width="34" height="34" />
            <rect x="10" y="10" width="34" height="34" transform="rotate(45 27 27)" />
          </g>
        </pattern>
      </defs>
      <rect width="850" height="550" fill={`url(#${patternId})`} opacity={0.08} />
    </svg>
  );
}

/** One physical 85mm x 55mm access-code card. Pure/presentational — given
 *  already-resolved PrintCard data, doesn't know about pagination or
 *  print mode. Sized in millimetres throughout (see CARD_LAYOUT) so the
 *  screen preview and the printed page are numerically identical. */
function CodeCard({ card }: { card: PrintCard }) {
  return (
    <div className="code-card-print" style={{
      position: "relative", overflow: "hidden", boxSizing: "border-box",
      width: `${CARD_LAYOUT.cardWidthMm}mm`, height: `${CARD_LAYOUT.cardHeightMm}mm`,
      borderRadius: "3.2mm",
      background: `radial-gradient(130% 150% at 12% -10%, ${GREEN} 0%, ${GREEN_DEEP} 55%, #000 135%)`,
      fontFamily: "Cairo,sans-serif", color: "#FAF7F0",
    }}>
      <CardPattern cardId={card.id} />

      <div style={{
        position: "relative", zIndex: 1, margin: "2.6mm",
        height: "calc(100% - 5.2mm)", boxSizing: "border-box",
        border: `0.3mm solid ${GOLD}`, borderRadius: "2.4mm", padding: "2mm 3mm",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        {/* Header: teacher photo seal + academy name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.6mm" }}>
          <img src="/mostafa-portrait.png" alt="" style={{
            width: "6mm", height: "6mm", borderRadius: "50%", objectFit: "cover",
            objectPosition: "center 20%", border: `0.3mm solid ${GOLD_LIGHT}`, flexShrink: 0,
          }} />
          <h1 style={{
            margin: 0, fontFamily: "Amiri,serif", fontWeight: 800, fontSize: "4mm",
            lineHeight: 1.2, color: GOLD_LIGHT, textAlign: "center",
          }}>
            أكاديمية مستر مصطفى
          </h1>
        </div>

        {/* Course + level */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2mm", fontSize: "2.6mm", opacity: 0.92 }}>
          <span style={{ fontWeight: 700 }}>{card.courseName || "—"}</span>
          {card.levelLabel && (
            <>
              <span style={{ width: "1mm", height: "1mm", borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
              <span style={{ fontWeight: 500, opacity: 0.85 }}>{card.levelLabel}</span>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: "2.2mm", color: GOLD_LIGHT, opacity: 0.85 }}>
          كود الطالب
        </div>

        {/* Code plate */}
        <div style={{
          background: "#FAF7F0", borderRadius: "2mm", padding: "1.6mm 3mm",
          minHeight: "8mm", boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `inset 0 0 0 0.25mm ${GOLD}`,
        }}>
          <span style={{
            fontFamily: "monospace", fontWeight: 700, fontSize: "4.6mm", letterSpacing: "0.5px",
            color: GREEN_DEEP, direction: "ltr", unicodeBidi: "isolate", whiteSpace: "nowrap",
          }}>
            {card.code}
          </span>
        </div>

        {/* Footer: year + slogan */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "2mm", opacity: 0.85 }}>
          <span style={{ fontWeight: 600 }}>{currentAcademicYear()}</span>
          <span>نسير على نهج العلم والإتقان</span>
        </div>
      </div>
    </div>
  );
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

  // ── Print mode (single card / a hand-picked subset / the whole batch) ──
  // Ported from the reviewed standalone module: printing 500 codes and
  // printing just the one a student is waiting for right now are different
  // enough workflows to deserve their own modes, not just "print everything
  // or nothing".
  const [printMode,   setPrintMode]   = useState<PrintMode>("batch");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [singleId,    setSingleId]    = useState<string | undefined>(undefined);

  const printCards = useMemo(() => toPrintCards(newCodes), [newCodes]);
  const cardsToPrint = useMemo(() => {
    if (printMode === "batch") return printCards;
    if (printMode === "single") return printCards.filter((c) => c.id === singleId);
    return printCards.filter((c) => selectedIds.has(c.id));
  }, [printMode, printCards, selectedIds, singleId]);
  const pageCount = useMemo(() => chunkIntoPages(cardsToPrint).length, [cardsToPrint]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

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
        // Fresh batch → fresh print-mode state, otherwise a stale
        // single/selected pick from a previous batch could silently
        // carry over (or point at ids that no longer exist).
        setPrintMode("batch");
        setSelectedIds(new Set());
        setSingleId(res.data.codes[0]?.id);
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

  const handlePrint = () => triggerPrint(generatePrintTitle(cardsToPrint.length));

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
                original "prints blank" bug.
                Mode switch (single / selected / batch) ported from the
                reviewed module: printing the one code a student is
                waiting for right now is a different workflow than
                printing a batch of 500, and deserves its own mode rather
                than "print everything or nothing". */}
            <div className="rounded-2xl p-6 mb-8 no-print"
              style={{ background: "rgba(45,158,107,0.05)", border: "1px solid rgba(45,158,107,0.25)" }}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 style={{ fontFamily: "Amiri,serif", color: "#1A6B47", fontSize: 20 }}>
                  ✅ تم توليد {newCodes.length} كود جديد
                </h3>
                <div className="flex gap-2">
                  <button onClick={handlePrint} disabled={cardsToPrint.length === 0}
                    style={{ padding: "8px 18px", borderRadius: 10,
                      background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                      color: "#1A1208", fontFamily: "Cairo,sans-serif",
                      fontWeight: 700, fontSize: 13, border: "none",
                      cursor: cardsToPrint.length === 0 ? "not-allowed" : "pointer",
                      opacity: cardsToPrint.length === 0 ? 0.5 : 1 }}>
                    🖨️ طباعة ({cardsToPrint.length} كرت · {pageCount} ص)
                  </button>
                  <button onClick={() => setShowPrint(false)}
                    style={{ padding: "8px 14px", borderRadius: 10,
                      border: "1px solid rgba(201,168,76,0.3)", color: "#8B6914",
                      background: "none", fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer" }}>
                    إغلاق
                  </button>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  ["batch", "الدفعة كاملة"],
                  ["selected", "كروت محددة"],
                  ["single", "كرت واحد"],
                ] as [PrintMode, string][]).map(([m, label]) => (
                  <button key={m} onClick={() => setPrintMode(m)}
                    style={{
                      padding: "6px 16px", borderRadius: 999,
                      border: `1px solid ${printMode === m ? "transparent" : "rgba(201,168,76,0.3)"}`,
                      background: printMode === m ? "linear-gradient(135deg,#C9A84C,#8B6914)" : "none",
                      color: printMode === m ? "#1A1208" : "#8B6914",
                      fontFamily: "Cairo,sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Selected mode — pick a subset */}
              {printMode === "selected" && (
                <div className="mt-3">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => setSelectedIds(new Set(printCards.map((c) => c.id)))}
                      style={{ fontFamily: "Cairo,sans-serif", fontSize: 12, color: "#1A6B47", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                      تحديد الكل
                    </button>
                    <button onClick={() => setSelectedIds(new Set())}
                      style={{ fontFamily: "Cairo,sans-serif", fontSize: 12, color: "#7A6E5A", background: "none", border: "none", cursor: "pointer" }}>
                      إلغاء التحديد
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2" style={{ maxHeight: 160, overflowY: "auto" }}>
                    {printCards.map((c) => (
                      <label key={c.id} className="flex items-center gap-1.5"
                        style={{
                          padding: "4px 10px", borderRadius: 8, cursor: "pointer",
                          border: `1px solid ${selectedIds.has(c.id) ? "#C9A84C" : "rgba(201,168,76,0.25)"}`,
                          background: selectedIds.has(c.id) ? "rgba(201,168,76,0.1)" : "none",
                        }}>
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelected(c.id)} />
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1A1208" }}>{c.code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Single mode — pick exactly one */}
              {printMode === "single" && (
                <div className="mt-3">
                  <select value={singleId ?? ""} onChange={(e) => setSingleId(e.target.value)}
                    style={{
                      padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(201,168,76,0.3)",
                      fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208", background: "#fff",
                    }}>
                    {printCards.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} — {c.courseName || "بدون كورس"}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Print pages — sits outside the no-print toolbar box above, so
                it prints on its own with no decorative background/border
                eating into the page. Cards are chunked into explicit
                per-page groups (CARDS_PER_PAGE = 10) rather than one
                continuous grid left to the browser's own print
                pagination — CSS Grid auto-breaking across printed pages
                is exactly the kind of "browser inconsistency" that's
                unreliable across engines; one grid per physical page with
                an explicit break-after is deterministic everywhere. */}
            {cardsToPrint.length > 0 ? (
              <div ref={printRef} id="codes-print-grid">
                {chunkIntoPages(cardsToPrint).map((pageCards, pageIndex) => (
                  <div key={pageIndex}
                    className="print-page"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${CARD_LAYOUT.columns}, ${CARD_LAYOUT.cardWidthMm}mm)`,
                      gap: `${CARD_LAYOUT.gapMm}mm`, justifyContent: "center", marginBottom: 24,
                    }}>
                    {pageCards.map((card) => <CodeCard key={card.id} card={card} />)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-print" style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 32 }}>
                لا توجد كروت لعرضها بهذا الوضع — اختر كرتًا واحدًا على الأقل.
              </p>
            )}
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
