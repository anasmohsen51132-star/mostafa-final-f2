"use client";
// src/app/(developer)/developer/monitoring/page.tsx
//
// "System Events" (Task 2, Section 5) — a chronological feed of platform
// events (logins, security events, and — once other parts of the app
// start calling src/lib/logger.ts — deployments, DB reconnects, etc).
// Reuses the exact same LogFilterBar/LogList/LogPagination components and
// /api/developer/logs endpoint as the Error Center, just with a
// chronological-feed-friendly default (status="all" instead of
// "unresolved", since most events here aren't "errors to resolve" at all).
import { useState } from "react";
import { m as motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { LogFilterBar } from "@/components/developer/logs/LogFilterBar";
import { LogList } from "@/components/developer/logs/LogList";
import { LogPagination } from "@/components/developer/logs/LogPagination";
import type { LogRow } from "@/components/developer/logs/types";

const PAGE_SIZE = 25;

export default function SystemEventsPage() {
  const [search, setSearch]     = useState("");
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus]     = useState("all");
  const [page, setPage]         = useState(1);

  const params = new URLSearchParams({
    page: String(page), limit: String(PAGE_SIZE), status,
    ...(search   ? { search }   : {}),
    ...(severity ? { severity } : {}),
    ...(category ? { category } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["developer-logs-events", search, severity, category, status, page],
    queryFn:  () => fetchWithAuth(`/api/developer/logs?${params.toString()}`),
  });

  const logs: LogRow[] = data?.data?.logs ?? [];
  const total: number  = data?.data?.total ?? 0;
  const totalPages     = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
          📡 أحداث النظام
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          سجل زمني لكل أحداث المنصة — {total} حدث مطابق للفلاتر الحالية
        </p>
      </motion.div>

      <LogFilterBar
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        severity={severity} onSeverityChange={(v) => { setSeverity(v); setPage(1); }}
        category={category} onCategoryChange={(v) => { setCategory(v); setPage(1); }}
        status={status} onStatusChange={(v) => { setStatus(v); setPage(1); }}
        searchPlaceholder="ابحث في الأحداث..."
      />

      <LogList logs={logs} isLoading={isLoading} emptyMessage="لا توجد أحداث مطابقة بعد" />

      <LogPagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
