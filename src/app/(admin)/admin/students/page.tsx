"use client";
// src/app/(admin)/admin/students/page.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { formatDate } from "@/lib/utils";
import { ACADEMIC_LEVEL_LABELS } from "@/types";
import type { User } from "@/types";

interface StudentRow extends User {
  redeemedCodes: {
    courses: { course: { id: string; title: string } }[];
  }[];
}

export default function AdminStudentsPage() {
  const toast = useToast();
  const qc    = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-students", search],
    queryFn:  () => fetchWithAuth(`/api/students?search=${encodeURIComponent(search)}&limit=50`),
  });

  const students: StudentRow[] = data?.data?.students ?? [];
  const total: number          = data?.data?.total ?? 0;

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetchWithAuth(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.data.isActive ? "✅ تم تفعيل الحساب" : "✅ تم تعطيل الحساب");
        qc.invalidateQueries({ queryKey: ["admin-students"] });
      } else {
        toast.error(res.error ?? "فشل التحديث");
      }
    },
  });

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>الطلاب</h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          {total} طالب مسجل
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-6">
        <div style={{ position: "relative", maxWidth: 400 }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            style={{ width: "100%", padding: "11px 44px 11px 14px", borderRadius: 12, border: "1.5px solid rgba(201,168,76,0.25)", background: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 14, color: "#1A1208", outline: "none", direction: "rtl" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")} />
          <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 17, pointerEvents: "none" }}>🔍</span>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}</div>
      )}

      {/* Students table */}
      {!isLoading && students.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.04)" }}>
          {/* Header row */}
          <div className="grid gap-4 px-5 py-3" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr", background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
            {["الطالب","رقم الهاتف","المرحلة","الكورسات","الحالة"].map((h) => (
              <span key={h} style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 600 }}>{h}</span>
            ))}
          </div>

          {students.map((student, i) => {
            const courseCount = new Set(
              student.redeemedCodes.flatMap((c) => c.courses.map((cc) => cc.course.id))
            ).size;

            return (
              <motion.div key={student.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="grid gap-4 px-5 py-4 items-center"
                style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr", borderBottom: "1px solid rgba(201,168,76,0.07)" }}
                whileHover={{ background: "rgba(201,168,76,0.02)" }}>

                {/* Name + avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(26,107,71,0.2))", color: "#1A1208" }}>
                    {student.avatar ?? student.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: 600 }}>{student.name}</p>
                    <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>{formatDate(student.joinedAt)}</p>
                  </div>
                </div>

                <span style={{ fontFamily: "monospace", color: "#4A3F2A", fontSize: 13 }}>{student.phone}</span>

                <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                  {student.academicLevel ? ACADEMIC_LEVEL_LABELS[student.academicLevel] : "—"}
                </span>

                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 20, fontSize: 12,
                  background: "rgba(201,168,76,0.1)", color: "#8B6914",
                  fontFamily: "Cairo,sans-serif", fontWeight: 600,
                }}>
                  📚 {courseCount}
                </span>

                {/* Active toggle */}
                <button onClick={() => toggleActive.mutate({ id: student.id, isActive: !student.isActive })}
                  style={{
                    padding: "4px 12px", borderRadius: 20, border: "none",
                    background: student.isActive ? "rgba(45,158,107,0.12)" : "rgba(239,68,68,0.1)",
                    color: student.isActive ? "#1A6B47" : "#DC2626",
                    fontFamily: "Cairo,sans-serif", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                  {student.isActive ? "✅ نشط" : "⛔ موقوف"}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!isLoading && students.length === 0 && (
        <div className="text-center py-20">
          <div style={{ fontSize: 56, marginBottom: 16 }}>👥</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22 }}>
            {search ? "لا توجد نتائج" : "لا يوجد طلاب بعد"}
          </h3>
        </div>
      )}
    </div>
  );
}
