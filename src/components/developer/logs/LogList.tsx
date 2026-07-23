"use client";
// src/components/developer/logs/LogList.tsx
import Link from "next/link";
import { m as motion } from "framer-motion";
import { SeverityBadge, CategoryBadge } from "@/components/developer/logs/LogBadges";
import { formatLogDateTime } from "@/components/developer/logs/logMeta";
import type { LogRow } from "@/components/developer/logs/types";

interface LogListProps {
  logs: LogRow[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function LogList({ logs, isLoading, emptyMessage = "لا توجد سجلات مطابقة" }: LogListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "#fff", border: "1px dashed rgba(201,168,76,0.3)", fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl"
      style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 12px rgba(26,18,8,0.04)", overflowX: "auto" }}
    >
      <div style={{ minWidth: 680 }}>
        <div
          className="grid gap-3 px-5 py-3"
          style={{ gridTemplateColumns: "0.8fr 1fr 2.5fr 1fr 1fr 0.8fr", background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}
        >
          {["المستوى", "الفئة", "الرسالة", "المسار", "الوقت", "الحالة"].map((h) => (
            <span key={h} style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {logs.map((log, i) => (
          <Link key={log.id} href={`/developer/errors/${log.id}`} style={{ textDecoration: "none" }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="grid gap-3 px-5 py-4 items-center"
              style={{ gridTemplateColumns: "0.8fr 1fr 2.5fr 1fr 1fr 0.8fr", borderBottom: "1px solid rgba(201,168,76,0.07)", cursor: "pointer" }}
              whileHover={{ background: "rgba(201,168,76,0.02)" }}
            >
              <SeverityBadge severity={log.severity} />
              <CategoryBadge category={log.category} />
              <p style={{
                fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {log.message}
              </p>
              <span style={{ fontFamily: "monospace", color: "#7A6E5A", fontSize: 12 }}>{log.route ?? "—"}</span>
              <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>{formatLogDateTime(log.createdAt)}</span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4, width: "fit-content",
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                fontFamily: "Cairo,sans-serif",
                background: log.resolved ? "rgba(26,107,71,0.1)" : "rgba(179,38,30,0.08)",
                color: log.resolved ? "#1A6B47" : "#B3261E",
              }}>
                {log.resolved ? "✓ محلولة" : "● مفتوحة"}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
