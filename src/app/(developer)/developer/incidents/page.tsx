"use client";
// src/app/(developer)/developer/incidents/page.tsx
import { useState } from "react";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { IncidentSeverityBadge, IncidentStatusBadge } from "@/components/developer/incidents/IncidentBadges";
import { CATEGORY_LABEL, formatIncidentDateTime } from "@/components/developer/incidents/incidentMeta";
import { LogPagination } from "@/components/developer/logs/LogPagination";

interface IncidentRow {
  id: string; title: string; severity: string; status: string; category: string;
  firstDetectedAt: string; lastDetectedAt: string; occurrenceCount: number;
}

const PAGE_SIZE = 20;
const selectStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)",
  background: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208",
  outline: "none", direction: "rtl", cursor: "pointer",
};

export default function IncidentCenterPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState("MEDIUM");
  const [newCategory, setNewCategory] = useState("SYSTEM");

  const params = new URLSearchParams({
    page: String(page), limit: String(PAGE_SIZE),
    ...(search ? { search } : {}), ...(status ? { status } : {}), ...(severity ? { severity } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["incidents", search, status, severity, page],
    queryFn:  () => fetchWithAuth(`/api/developer/incidents?${params.toString()}`),
  });

  const createIncident = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/developer/incidents", {
        method: "POST",
        body: JSON.stringify({ title: newTitle, severity: newSeverity, category: newCategory }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم إنشاء الحادثة");
        setShowCreate(false); setNewTitle("");
        qc.invalidateQueries({ queryKey: ["incidents"] });
      } else toast.error(res.error ?? "فشل الإنشاء");
    },
  });

  const incidents: IncidentRow[] = data?.data?.incidents ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>🧩 مركز الحوادث</h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {total} حادثة — تُكتشف وتُجمَّع تلقائيًا من الأخطاء المتكررة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/developer/incidents/export"
            style={{
              background: "#fff", color: "#1A6B47", border: "1.5px solid #1A6B47", borderRadius: 10,
              padding: "9px 16px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 13, textDecoration: "none",
            }}
          >
            ⬇️ تصدير CSV
          </a>
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{
              background: "#1A6B47", color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 20px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 13.5, cursor: "pointer",
            }}
          >
            + حادثة يدوية
          </button>
        </div>
      </motion.div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl p-5 mb-6" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div className="flex flex-wrap gap-3">
            <input
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان الحادثة"
              style={{ flex: "1 1 260px", padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)", fontFamily: "Cairo,sans-serif", fontSize: 13, outline: "none", direction: "rtl" }}
            />
            <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} style={selectStyle}>
              <option value="LOW">منخفضة</option><option value="MEDIUM">متوسطة</option>
              <option value="HIGH">عالية</option><option value="CRITICAL">حرجة</option>
            </select>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={selectStyle}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button
              onClick={() => createIncident.mutate()}
              disabled={newTitle.length < 3 || createIncident.isPending}
              style={{ background: "#C9A84C", color: "#1A1208", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer", opacity: newTitle.length < 3 ? 0.5 : 1 }}
            >
              إنشاء
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث في العناوين..."
          style={{ flex: "1 1 240px", padding: "11px 14px", borderRadius: 12, border: "1.5px solid rgba(201,168,76,0.25)", background: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 14, outline: "none", direction: "rtl" }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">كل الحالات</option>
          <option value="OPEN">مفتوحة</option><option value="INVESTIGATING">قيد الفحص</option>
          <option value="RESOLVED">محلولة</option><option value="CLOSED">مغلقة</option>
        </select>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">كل الخطورات</option>
          <option value="LOW">منخفضة</option><option value="MEDIUM">متوسطة</option>
          <option value="HIGH">عالية</option><option value="CRITICAL">حرجة</option>
        </select>
      </div>

      {isLoading && <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton rounded-xl h-20" />)}</div>}

      {!isLoading && incidents.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)" }}>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A6B47" }}>✅ لا توجد حوادث مطابقة</p>
        </div>
      )}

      {!isLoading && incidents.length > 0 && (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <Link key={inc.id} href={`/developer/incidents/${inc.id}`} style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ x: -3 }} className="rounded-2xl p-5 flex flex-wrap items-center gap-3" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <IncidentSeverityBadge severity={inc.severity} />
                    <IncidentStatusBadge status={inc.status} />
                    <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>{CATEGORY_LABEL[inc.category] ?? inc.category}</span>
                  </div>
                  <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 14 }}>{inc.title}</p>
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 12, fontWeight: 700 }}>×{inc.occurrenceCount}</p>
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11 }}>{formatIncidentDateTime(inc.lastDetectedAt)}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      <LogPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
