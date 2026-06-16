"use client";
// src/app/(admin)/admin/results/page.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "@/components/layout/PageTransition";

interface QuizRow {
  type: "quiz"; id: string;
  studentId: string; studentName: string; studentPhone: string;
  courseTitle: string; lectureTitle: string; quizTitle: string;
  attemptNumber: number; score: number; total: number;
  percentage: number; passed: boolean; submittedAt: string;
}

interface HwRow {
  type: "homework"; id: string;
  studentId: string; studentName: string; studentPhone: string;
  courseTitle: string; lectureTitle: string; homeworkTitle: string;
  attemptNumber: number; grade: number | null; submittedAt: string;
}

type ResultRow = QuizRow | HwRow;

export default function ResultsPage() {
  const [activeTab,   setActiveTab]   = useState<"quiz" | "homework">("quiz");
  const [searchName,  setSearchName]  = useState("");
  const [filterPass,  setFilterPass]  = useState<"all" | "passed" | "failed">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-results"],
    queryFn:  () => fetchWithAuth("/api/results"),
    refetchInterval: 60_000,
  });

  const quizRows:  QuizRow[] = data?.data?.quizResults     ?? [];
  const hwRows:    HwRow[]   = data?.data?.homeworkResults ?? [];

  const rows: ResultRow[] = activeTab === "quiz" ? quizRows : hwRows;

  const filtered = rows.filter((r) => {
    const nameMatch = searchName === "" ||
      r.studentName.includes(searchName) ||
      r.studentPhone.includes(searchName);
    if (activeTab === "quiz") {
      const q = r as QuizRow;
      const passMatch = filterPass === "all" ||
        (filterPass === "passed" && q.passed) ||
        (filterPass === "failed" && !q.passed);
      return nameMatch && passMatch;
    }
    return nameMatch;
  });

  // Aggregated stats
  const totalAttempts  = quizRows.length;
  const passedAttempts = quizRows.filter((r) => r.passed).length;
  const avgScore       = quizRows.length
    ? Math.round(quizRows.reduce((s, r) => s + r.percentage, 0) / quizRows.length)
    : 0;

  const tabBtn = (id: "quiz" | "homework", label: string, count: number) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: "9px 20px", borderRadius: 12, border: "1.5px solid",
        borderColor: activeTab === id ? "#C9A84C" : "rgba(201,168,76,0.25)",
        background:  activeTab === id ? "rgba(201,168,76,0.12)" : "#fff",
        color:       activeTab === id ? "#8B6914" : "#7A6E5A",
        fontFamily: "Cairo,sans-serif", fontSize: 13,
        fontWeight: activeTab === id ? 700 : 400, cursor: "pointer",
      }}
    >
      {label}
      <span
        className="mr-2 px-2 py-0.5 rounded-full text-xs"
        style={{
          background: activeTab === id ? "#C9A84C" : "rgba(201,168,76,0.15)",
          color: activeTab === id ? "#1A1208" : "#8B6914",
          fontWeight: 700,
        }}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
          نتائج الطلاب
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          عرض جميع محاولات الاختبارات والواجبات
        </p>
      </motion.div>

      {/* Stats row */}
      {!isLoading && (
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "📝", value: totalAttempts,  label: "محاولة اختبار كلي",   color: "#C9A84C" },
            { icon: "✅", value: passedAttempts, label: "محاولة ناجحة",         color: "#2D9E6B" },
            { icon: "❌", value: totalAttempts - passedAttempts, label: "محاولة راسبة", color: "#DC2626" },
            { icon: "📊", value: `${avgScore}٪`, label: "متوسط الدرجات",        color: "#C9A84C" },
          ].map((s, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl p-5"
                style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.05)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3"
                  style={{ background: `${s.color}18` }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: "Amiri,serif", color: s.color, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                  {s.value}
                </div>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 4 }}>
                  {s.label}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="flex gap-2">
          {tabBtn("quiz",     "الاختبارات", quizRows.length)}
          {tabBtn("homework", "الواجبات",   hwRows.length)}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              value={searchName} onChange={(e) => setSearchName(e.target.value)}
              placeholder="بحث باسم الطالب أو الهاتف"
              style={{
                padding: "8px 36px 8px 12px", borderRadius: 10,
                border: "1.5px solid rgba(201,168,76,0.25)", background: "#fff",
                fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208",
                outline: "none", width: 220, direction: "rtl",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
            />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>
              🔍
            </span>
          </div>
          {/* Pass filter — quiz only */}
          {activeTab === "quiz" && (
            <select
              value={filterPass}
              onChange={(e) => setFilterPass(e.target.value as typeof filterPass)}
              style={{
                padding: "8px 12px", borderRadius: 10,
                border: "1.5px solid rgba(201,168,76,0.25)", background: "#fff",
                fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208",
                outline: "none", direction: "rtl", cursor: "pointer",
              }}
            >
              <option value="all">الكل</option>
              <option value="passed">الناجحون فقط</option>
              <option value="failed">الراسبون فقط</option>
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.12)" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 8 }}>
            {searchName ? "لا توجد نتائج مطابقة" : "لا توجد بيانات بعد"}
          </h3>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {searchName ? "جرب البحث بكلمات أخرى" : "ستظهر النتائج هنا عند تسليم الطلاب للاختبارات"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.04)" }}>
          {/* Table header */}
          {activeTab === "quiz" ? (
            <>
              <div className="grid gap-3 px-5 py-3 text-xs font-semibold"
                style={{
                  gridTemplateColumns: "1.8fr 1.4fr 1.4fr 1.2fr 0.8fr 1fr 0.8fr",
                  background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)",
                  fontFamily: "Cairo,sans-serif", color: "#7A6E5A",
                }}>
                <span>الطالب</span>
                <span>الكورس</span>
                <span>المحاضرة</span>
                <span>الاختبار</span>
                <span>المحاولة</span>
                <span>الدرجة</span>
                <span>الحالة</span>
              </div>
              {(filtered as QuizRow[]).map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="grid gap-3 px-5 py-3 items-center"
                  style={{
                    gridTemplateColumns: "1.8fr 1.4fr 1.4fr 1.2fr 0.8fr 1fr 0.8fr",
                    borderBottom: "1px solid rgba(201,168,76,0.07)",
                  }}
                  whileHover={{ background: "rgba(201,168,76,0.02)" }}
                >
                  <div>
                    <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: 600 }}>
                      {r.studentName}
                    </p>
                    <p style={{ fontFamily: "monospace", color: "#7A6E5A", fontSize: 11 }}>
                      {r.studentPhone}
                    </p>
                  </div>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>
                    {r.courseTitle}
                  </span>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>
                    {r.lectureTitle}
                  </span>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>
                    {r.quizTitle}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-center"
                    style={{
                      background: "rgba(201,168,76,0.1)", color: "#8B6914",
                      fontFamily: "Cairo,sans-serif", display: "inline-block",
                    }}
                  >
                    #{r.attemptNumber}
                  </span>
                  <div>
                    <span style={{ fontFamily: "Amiri,serif", color: r.passed ? "#1A6B47" : "#DC2626", fontSize: 16, fontWeight: 700 }}>
                      {r.percentage}٪
                    </span>
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11, marginRight: 4 }}>
                      ({r.score}/{r.total})
                    </span>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: r.passed ? "rgba(45,158,107,0.1)" : "rgba(239,68,68,0.08)",
                    color: r.passed ? "#1A6B47" : "#DC2626",
                    fontFamily: "Cairo,sans-serif", display: "inline-block",
                  }}>
                    {r.passed ? "✅ ناجح" : "❌ راسب"}
                  </span>
                </motion.div>
              ))}
            </>
          ) : (
            <>
              <div className="grid gap-3 px-5 py-3 text-xs font-semibold"
                style={{
                  gridTemplateColumns: "2fr 1.4fr 1.4fr 1.2fr 0.8fr 1fr 1.4fr",
                  background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)",
                  fontFamily: "Cairo,sans-serif", color: "#7A6E5A",
                }}>
                <span>الطالب</span>
                <span>الكورس</span>
                <span>المحاضرة</span>
                <span>الواجب</span>
                <span>المحاولة</span>
                <span>الدرجة</span>
                <span>تاريخ التسليم</span>
              </div>
              {(filtered as HwRow[]).map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="grid gap-3 px-5 py-3 items-center"
                  style={{
                    gridTemplateColumns: "2fr 1.4fr 1.4fr 1.2fr 0.8fr 1fr 1.4fr",
                    borderBottom: "1px solid rgba(201,168,76,0.07)",
                  }}
                  whileHover={{ background: "rgba(201,168,76,0.02)" }}
                >
                  <div>
                    <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13, fontWeight: 600 }}>
                      {r.studentName}
                    </p>
                    <p style={{ fontFamily: "monospace", color: "#7A6E5A", fontSize: 11 }}>
                      {r.studentPhone}
                    </p>
                  </div>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>{r.courseTitle}</span>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>{r.lectureTitle}</span>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12 }}>{r.homeworkTitle}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "rgba(201,168,76,0.1)", color: "#8B6914", fontFamily: "Cairo,sans-serif", display: "inline-block" }}>
                    #{r.attemptNumber}
                  </span>
                  <span style={{
                    fontFamily: "Cairo,sans-serif", fontSize: 13, fontWeight: 700,
                    color: r.grade !== null ? "#1A6B47" : "#7A6E5A",
                  }}>
                    {r.grade !== null ? `${r.grade}/100` : "لم يُصحَّح بعد"}
                  </span>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                    {formatDate(r.submittedAt)}
                  </span>
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Row count */}
      {filtered.length > 0 && (
        <p className="mt-3" style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
          إجمالي النتائج المعروضة: {filtered.length}
        </p>
      )}
    </div>
  );
}
