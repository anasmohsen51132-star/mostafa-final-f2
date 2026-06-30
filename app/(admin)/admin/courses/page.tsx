"use client";
// src/app/(admin)/admin/courses/page.tsx
import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";
import { ACADEMIC_LEVEL_LABELS } from "@/types";
import type { Course } from "@/types";

export default function AdminCoursesPage() {
  const toast = useToast();
  const qc    = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => fetchWithAuth("/api/courses"),
  });

  const courses: (Course & { unlocked?: boolean })[] = data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/courses/${id}`, { method: "DELETE" }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم حذف الكورس");
        qc.invalidateQueries({ queryKey: ["admin-courses"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
      setDeleteTarget(null);
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      fetchWithAuth(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished: published }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.data.isPublished ? "✅ تم نشر الكورس" : "✅ تم إخفاء الكورس");
        qc.invalidateQueries({ queryKey: ["admin-courses"] });
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
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>الكورسات</h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {courses.length} كورس إجمالاً
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          style={{
            padding: "11px 28px", borderRadius: 14,
            background: "linear-gradient(135deg,#C9A84C,#8B6914)",
            boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
            color: "#1A1208", fontFamily: "Cairo,sans-serif",
            fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}
        >
          ＋ إضافة كورس
        </Link>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-48" />)}
        </div>
      )}

      {/* Courses grid */}
      {!isLoading && courses.length > 0 && (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <StaggerItem key={course.id}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 4px 16px rgba(26,18,8,0.05)" }}
              >
                {/* Color header */}
                <div
                  className="h-24 flex items-center justify-between px-5"
                  style={{ background: `${course.color}18`, borderBottom: `2px solid ${course.color}25` }}
                >
                  <span style={{ fontSize: 36 }}>{course.icon}</span>
                  {/* Publish toggle */}
                  <button
                    onClick={() => togglePublish.mutate({ id: course.id, published: !course.isPublished })}
                    style={{
                      padding: "4px 12px", borderRadius: 20, border: "none",
                      background: course.isPublished ? "rgba(45,158,107,0.9)" : "rgba(122,110,90,0.3)",
                      color: course.isPublished ? "#fff" : "#7A6E5A",
                      fontFamily: "Cairo,sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {course.isPublished ? "✅ منشور" : "⬜ مخفي"}
                  </button>
                </div>

                <div className="p-5">
                  <h3 style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="line-clamp-2" style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 8 }}>
                      {course.description}
                    </p>
                  )}

                  {/* Level badges */}
                  {course.levels && course.levels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-10">
                      {course.levels.map((l) => (
                        <span
                          key={l.academicLevel}
                          style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: 10,
                            background: "rgba(201,168,76,0.1)", color: "#8B6914",
                            border: "1px solid rgba(201,168,76,0.2)", fontFamily: "Cairo,sans-serif",
                          }}
                        >
                          {ACADEMIC_LEVEL_LABELS[l.academicLevel]}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, flex: 1 }}>
                      📖 {course._count?.lectures ?? 0} محاضرة
                    </span>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      style={{
                        padding: "5px 14px", borderRadius: 9,
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: "#8B6914", fontFamily: "Cairo,sans-serif",
                        fontSize: 12, fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      تعديل
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(course.id)}
                      style={{
                        padding: "5px 14px", borderRadius: 9,
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#DC2626", fontFamily: "Cairo,sans-serif",
                        fontSize: 12, fontWeight: 600, background: "none", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Empty */}
      {!isLoading && courses.length === 0 && (
        <div className="text-center py-20">
          <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 24, marginBottom: 12 }}>لا توجد كورسات</h3>
          <Link href="/admin/courses/new" style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 14, textDecoration: "none" }}>
            ＋ أضف أول كورس
          </Link>
        </div>
      )}

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl p-8 max-w-sm w-full text-center"
              style={{ background: "#fff", direction: "rtl" }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 8 }}>
                تأكيد الحذف
              </h3>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14, marginBottom: 24 }}>
                سيتم حذف الكورس وجميع محاضراته. هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget)}
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
