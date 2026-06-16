"use client";
// src/app/(admin)/admin/lectures/new/page.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import type { Course } from "@/types";

export default function NewLecturePage() {
  const router = useRouter();
  const toast  = useToast();
  const qc     = useQueryClient();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [courseIds,   setCourseIds]   = useState<string[]>([]);

  // Load all courses to pick from
  const { data: coursesRes } = useQuery({
    queryKey: ["all-courses"],
    queryFn:  () => fetchWithAuth("/api/courses"),
  });
  const courses: Course[] = coursesRes?.data ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/lectures", {
        method: "POST",
        body: JSON.stringify({ title, description, courseIds }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم إنشاء المحاضرة");
        qc.invalidateQueries({ queryKey: ["admin-lectures"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
        router.push(`/admin/lectures/${res.data.id}`);
      } else {
        toast.error(res.error ?? "فشل الإنشاء");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const toggleCourse = (id: string) =>
    setCourseIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim())          { toast.error("أدخل عنوان المحاضرة"); return; }
    if (courseIds.length === 0) { toast.error("اختر كورساً واحداً على الأقل"); return; }
    mutation.mutate();
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: "Cairo,sans-serif", color: "#4A3F2A",
    fontSize: 13, marginBottom: 6, display: "block", fontWeight: 600,
  };
  const fieldInput: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 14,
    outline: "none", direction: "rtl", transition: "border-color 0.2s",
  };

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Link href="/admin/lectures" style={{ color: "#C9A84C", fontFamily: "Cairo,sans-serif", fontSize: 13, textDecoration: "none" }}>
          ← المحاضرات
        </Link>
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 30 }}>
          إضافة محاضرة جديدة
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 space-y-5"
          >
            {/* Basic info */}
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 18, marginBottom: 16 }}>معلومات المحاضرة</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>عنوان المحاضرة *</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: الدرس الأول: المبتدأ والخبر"
                  style={fieldInput}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                />
              </div>
              <div>
                <label style={fieldLabel}>وصف المحاضرة</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب ملاحظة مختصرة عن هذه المحاضرة..."
                  rows={3}
                  style={{ ...fieldInput, resize: "vertical" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                />
              </div>
            </div>

            {/* Course assignment */}
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 18, marginBottom: 6 }}>ربط بكورسات</h2>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 16 }}>
                يمكنك ربط هذه المحاضرة بأكثر من كورس. ستظهر في جميع الكورسات المختارة.
              </p>

              {courses.length === 0 ? (
                <div className="text-center py-6">
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
                    لا توجد كورسات بعد.{" "}
                    <Link href="/admin/courses/new" style={{ color: "#C9A84C", textDecoration: "none" }}>
                      أضف كورساً أولاً ←
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {courses.map((course) => {
                    const selected = courseIds.includes(course.id);
                    return (
                      <motion.button
                        key={course.id} type="button"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => toggleCourse(course.id)}
                        className="flex items-center gap-3 p-4 rounded-xl text-right"
                        style={{
                          border: "1.5px solid",
                          borderColor: selected ? "#C9A84C" : "rgba(201,168,76,0.2)",
                          background: selected ? "rgba(201,168,76,0.08)" : "transparent",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{course.icon}</span>
                        <div className="flex-1 text-right">
                          <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: selected ? 700 : 400 }}>
                            {course.title}
                          </p>
                          {course.isPublished ? (
                            <p style={{ fontFamily: "Cairo,sans-serif", color: "#2D9E6B", fontSize: 11 }}>✅ منشور</p>
                          ) : (
                            <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>⬜ مخفي</p>
                          )}
                        </div>
                        <div
                          style={{
                            width: 20, height: 20, borderRadius: 6, border: "2px solid",
                            borderColor: selected ? "#C9A84C" : "rgba(201,168,76,0.35)",
                            background: selected ? "#C9A84C" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 12, transition: "all 0.15s",
                            flexShrink: 0,
                          }}
                        >
                          {selected ? "✓" : ""}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {courseIds.length > 0 && (
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#2D9E6B", fontSize: 13, marginTop: 12 }}>
                  ✅ تم اختيار {courseIds.length} كورس
                </p>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            {/* Info box */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#8B6914", fontSize: 15, marginBottom: 10 }}>
                💡 نظام إعادة الاستخدام
              </h3>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 1.75 }}>
                المحاضرة تُنشأ مرة واحدة ثم تُربط بأي عدد من الكورسات. أي تعديل على المحاضرة ينعكس تلقائياً على جميع الكورسات.
              </p>
            </div>

            {/* Next steps */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 15, marginBottom: 10 }}>بعد الإنشاء</h3>
              <ul style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, lineHeight: 2 }}>
                <li>🎥 إضافة فيديوهات يوتيوب</li>
                <li>📄 رفع ملفات PDF</li>
                <li>📝 إنشاء اختبارات</li>
                <li>📋 إضافة واجبات</li>
              </ul>
            </div>

            <motion.button
              type="submit" disabled={mutation.isPending}
              whileHover={!mutation.isPending ? { y: -2 } : {}}
              whileTap={!mutation.isPending ? { scale: 0.98 } : {}}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: mutation.isPending ? "rgba(201,168,76,0.35)" : "linear-gradient(135deg,#C9A84C,#8B6914)",
                boxShadow: mutation.isPending ? "none" : "0 6px 20px rgba(201,168,76,0.4)",
                color: "#1A1208", fontFamily: "Cairo,sans-serif",
                fontWeight: 700, fontSize: 15,
                cursor: mutation.isPending ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
            >
              {mutation.isPending ? "⏳ جارٍ الحفظ..." : "💾 إنشاء المحاضرة"}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
