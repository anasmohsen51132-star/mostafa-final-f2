"use client";
// src/app/(admin)/admin/courses/[id]/page.tsx
import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import {
  ACADEMIC_LEVEL_LABELS,
  ACADEMIC_LEVELS,
  type AcademicLevel,
} from "@/types";

const ICONS  = ["📖","📚","✏️","🎓","📝","💡","🌟","🏆","🔬","🎨","📐","🖊️"];
const COLORS = [
  "#1A6B47","#C9A84C","#2563EB","#7C3AED","#DC2626",
  "#059669","#D97706","#0891B2","#BE185D","#65A30D",
];

export default function EditCoursePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useToast();
  const qc      = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-course", id],
    queryFn:  () => fetchWithAuth(`/api/courses/${id}`),
    enabled:  !!id,
  });

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [icon,        setIcon]        = useState("📖");
  const [color,       setColor]       = useState("#1A6B47");
  const [isPublished, setIsPublished] = useState(false);
  const [levels,      setLevels]      = useState<AcademicLevel[]>([]);

  // Prefill form when data arrives
  useEffect(() => {
    const c = data?.data;
    if (!c) return;
    setTitle(c.title ?? "");
    setDescription(c.description ?? "");
    setIcon(c.icon ?? "📖");
    setColor(c.color ?? "#1A6B47");
    setIsPublished(c.isPublished ?? false);
    setLevels((c.levels ?? []).map((l: { academicLevel: AcademicLevel }) => l.academicLevel));
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      fetchWithAuth(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title, description, icon, color, isPublished, levels }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم تحديث الكورس");
        qc.invalidateQueries({ queryKey: ["admin-courses"] });
        qc.invalidateQueries({ queryKey: ["admin-course", id] });
        router.push("/admin/courses");
      } else {
        toast.error(res.error ?? "فشل التحديث");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const toggleLevel = (lvl: AcademicLevel) =>
    setLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("أدخل عنوان الكورس"); return; }
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div style={{ direction: "rtl" }}>
        <div className="skeleton rounded-3xl h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="skeleton rounded-2xl h-60" />
            <div className="skeleton rounded-2xl h-40" />
          </div>
          <div className="space-y-5">
            <div className="skeleton rounded-2xl h-40" />
            <div className="skeleton rounded-2xl h-32" />
          </div>
        </div>
      </div>
    );
  }

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
        <Link
          href="/admin/courses"
          style={{ color: "#C9A84C", fontFamily: "Cairo,sans-serif", fontSize: 13, textDecoration: "none" }}
        >
          ← الكورسات
        </Link>
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 30 }}>
          تعديل: {data?.data?.title}
        </h1>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 space-y-5"
          >
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 18, marginBottom: 16 }}>المعلومات الأساسية</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>عنوان الكورس *</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  style={fieldInput}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                />
              </div>
              <div>
                <label style={fieldLabel}>وصف الكورس</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ ...fieldInput, resize: "vertical" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                />
              </div>
            </div>

            {/* Academic levels */}
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 18, marginBottom: 6 }}>المراحل الدراسية</h2>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13, marginBottom: 16 }}>
                الكورسات بدون مرحلة محددة تظهر لجميع الطلاب.
              </p>
              <div className="flex flex-wrap gap-3">
                {ACADEMIC_LEVELS.map((lvl) => {
                  const selected = levels.includes(lvl);
                  return (
                    <motion.button
                      key={lvl} type="button"
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      onClick={() => toggleLevel(lvl)}
                      style={{
                        padding: "10px 20px", borderRadius: 12, border: "1.5px solid",
                        borderColor: selected ? "#C9A84C" : "rgba(201,168,76,0.25)",
                        background: selected ? "rgba(201,168,76,0.12)" : "transparent",
                        color: selected ? "#8B6914" : "#7A6E5A",
                        fontFamily: "Cairo,sans-serif", fontSize: 14,
                        fontWeight: selected ? 700 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {selected ? "✅ " : ""}{ACADEMIC_LEVEL_LABELS[lvl]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            {/* Preview */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 16, marginBottom: 12 }}>معاينة</h3>
              <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${color}35` }}>
                <div className="h-20 flex items-center justify-center text-4xl" style={{ background: `${color}18` }}>{icon}</div>
                <div className="p-3">
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: 700 }}>
                    {title || "عنوان الكورس"}
                  </p>
                </div>
              </div>
            </div>

            {/* Icon picker */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 16, marginBottom: 10 }}>الأيقونة</h3>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((ic) => (
                  <button key={ic} type="button" onClick={() => setIcon(ic)}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: 10, border: "1.5px solid",
                      borderColor: icon === ic ? "#C9A84C" : "rgba(201,168,76,0.2)",
                      background: icon === ic ? "rgba(201,168,76,0.12)" : "transparent",
                      fontSize: 20, cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >{ic}</button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 16, marginBottom: 10 }}>اللون</h3>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "2px solid",
                      borderColor: color === c ? "#1A1208" : "transparent",
                      background: c, cursor: "pointer",
                      outline: color === c ? "2px solid #C9A84C" : "none",
                      outlineOffset: 2, transition: "all 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Publish */}
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700 }}>نشر الكورس</p>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 2 }}>
                    {isPublished ? "مرئي للطلاب" : "مخفي"}
                  </p>
                </div>
                <button type="button" onClick={() => setIsPublished((p) => !p)}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: "none",
                    background: isPublished ? "#2D9E6B" : "rgba(122,110,90,0.3)",
                    cursor: "pointer", position: "relative", transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3,
                    right: isPublished ? 3 : "auto", left: isPublished ? "auto" : 3,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#fff", transition: "all 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>
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
              {mutation.isPending ? "⏳ جارٍ الحفظ..." : "💾 حفظ التعديلات"}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
