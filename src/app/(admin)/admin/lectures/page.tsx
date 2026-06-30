"use client";
// src/app/(admin)/admin/lectures/page.tsx
import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";

interface LectureRow {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  isPublished: boolean;
  courses: { course: { id: string; title: string; icon: string } }[];
  _count: { videos: number; pdfs: number; quizzes: number; homework: number };
}

export default function AdminLecturesPage() {
  const toast          = useToast();
  const qc             = useQueryClient();
  const [search,       setSearch]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lectures"],
    queryFn:  () => fetchWithAuth("/api/lectures?limit=100"),
  });

  const lectures: LectureRow[] = data?.data?.lectures ?? [];
  const filtered = lectures.filter(
    (l) => search === "" || l.title.includes(search)
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/lectures/${id}`, { method: "DELETE" }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم حذف المحاضرة");
        qc.invalidateQueries({ queryKey: ["admin-lectures"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
      setDeleteTarget(null);
    },
  });

  // API-004 FIX: lets admins actually use the new isPublished field — draft
  // a lecture while building it, then publish when it's ready for students.
  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      fetchWithAuth(`/api/lectures/${id}`, { method: "PUT", body: JSON.stringify({ isPublished }) }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.data.isPublished ? "✅ تم النشر للطلاب" : "📦 تم التحويل إلى مسودة");
        qc.invalidateQueries({ queryKey: ["admin-lectures"] });
      } else {
        toast.error(res.error ?? "فشل التحديث");
      }
    },
  });

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>المحاضرات</h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {lectures.length} محاضرة — يمكن ربط كل محاضرة بأكثر من كورس
          </p>
        </div>
        <Link
          href="/admin/lectures/new"
          style={{
            padding: "11px 28px", borderRadius: 14,
            background: "linear-gradient(135deg,#C9A84C,#8B6914)",
            boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
            color: "#1A1208", fontFamily: "Cairo,sans-serif",
            fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}
        >
          ＋ إضافة محاضرة
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-6"
      >
        <div style={{ position: "relative", maxWidth: 400 }}>
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن محاضرة..."
            style={{
              width: "100%", padding: "11px 44px 11px 14px",
              borderRadius: 12, border: "1.5px solid rgba(201,168,76,0.25)",
              background: "#fff", fontFamily: "Cairo,sans-serif",
              fontSize: 14, color: "#1A1208", outline: "none", direction: "rtl",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
          />
          <span style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", fontSize:17, pointerEvents:"none" }}>
            🔍
          </span>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-24" />)}
        </div>
      )}

      {/* Lectures list */}
      {!isLoading && filtered.length > 0 && (
        <StaggerContainer className="space-y-3">
          {filtered.map((lec) => (
            <StaggerItem key={lec.id}>
              <div
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 8px rgba(26,18,8,0.04)" }}
              >
                {/* Order / icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.12)" }}
                >
                  🎬
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 15, fontWeight: 700 }}>
                      {lec.title}
                    </h3>
                    {!lec.isPublished && (
                      <span style={{
                        padding: "1px 8px", borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                        background: "rgba(120,113,108,0.12)", color: "#78716C",
                        border: "1px solid rgba(120,113,108,0.25)", fontFamily: "Cairo,sans-serif",
                      }}>
                        مسودة 📦
                      </span>
                    )}
                  </div>
                  {lec.description && (
                    <p className="line-clamp-1" style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 6 }}>
                      {lec.description}
                    </p>
                  )}

                  {/* Content counts */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {lec._count.videos > 0   && <Chip icon="🎥" label={`${lec._count.videos} فيديو`} />}
                    {lec._count.pdfs > 0     && <Chip icon="📄" label={`${lec._count.pdfs} ملف`} />}
                    {lec._count.quizzes > 0  && <Chip icon="📝" label={`${lec._count.quizzes} اختبار`} />}
                    {lec._count.homework > 0 && <Chip icon="📋" label={`${lec._count.homework} واجب`} />}
                  </div>

                  {/* Linked courses */}
                  <div className="flex flex-wrap gap-1">
                    {lec.courses.map(({ course }) => (
                      <span
                        key={course.id}
                        style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 11,
                          background: "rgba(26,107,71,0.08)", color: "#1A6B47",
                          border: "1px solid rgba(26,107,71,0.18)", fontFamily: "Cairo,sans-serif",
                        }}
                      >
                        {course.icon} {course.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublish.mutate({ id: lec.id, isPublished: !lec.isPublished })}
                    disabled={togglePublish.isPending}
                    style={{
                      padding: "6px 14px", borderRadius: 9,
                      border: lec.isPublished ? "1px solid rgba(120,113,108,0.3)" : "1px solid rgba(26,107,71,0.3)",
                      color: lec.isPublished ? "#78716C" : "#1A6B47",
                      fontFamily: "Cairo,sans-serif",
                      fontSize: 12, fontWeight: 600, background: "none", cursor: "pointer",
                    }}
                  >
                    {lec.isPublished ? "📦 تحويل لمسودة" : "🚀 نشر"}
                  </button>
                  <Link
                    href={`/admin/lectures/${lec.id}`}
                    style={{
                      padding: "6px 14px", borderRadius: 9,
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: "#8B6914", fontFamily: "Cairo,sans-serif",
                      fontSize: 12, fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    تعديل
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(lec.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 9,
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#DC2626", fontFamily: "Cairo,sans-serif",
                      fontSize: 12, fontWeight: 600, background: "none", cursor: "pointer",
                    }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎬</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 12 }}>
            {search ? "لا توجد نتائج" : "لا توجد محاضرات"}
          </h3>
          {!search && (
            <Link href="/admin/lectures/new" style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 14, textDecoration: "none" }}>
              ＋ أضف أول محاضرة
            </Link>
          )}
        </div>
      )}

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl p-8 max-w-sm w-full text-center"
              style={{ background: "#fff", direction: "rtl" }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 8 }}>تأكيد الحذف</h3>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14, marginBottom: 24 }}>
                سيتم حذف المحاضرة مع جميع محتوياتها (فيديوهات، ملفات، اختبارات).
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget!)}
                  disabled={deleteMutation.isPending}
                  style={{
                    padding: "11px 28px", borderRadius: 12, border: "none",
                    background: "#DC2626", color: "#fff",
                    fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  {deleteMutation.isPending ? "⏳..." : "حذف"}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    padding: "11px 28px", borderRadius: 12,
                    border: "1px solid rgba(201,168,76,0.3)", background: "none",
                    color: "#8B6914", fontFamily: "Cairo,sans-serif",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}
                >
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

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 11,
      background: "rgba(201,168,76,0.1)", color: "#8B6914",
      border: "1px solid rgba(201,168,76,0.2)", fontFamily: "Cairo,sans-serif",
    }}>
      {icon} {label}
    </span>
  );
}
