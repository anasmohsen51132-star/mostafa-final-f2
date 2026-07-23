"use client";
// src/components/developer/logs/LogFilterBar.tsx
import { LOG_SEVERITIES, LOG_CATEGORIES, SEVERITY_META, CATEGORY_META } from "@/components/developer/logs/logMeta";

const selectStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10,
  border: "1.5px solid rgba(201,168,76,0.25)", background: "#fff",
  fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208",
  outline: "none", direction: "rtl", cursor: "pointer",
};

interface LogFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  severity: string;
  onSeverityChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  searchPlaceholder?: string;
}

export function LogFilterBar({
  search, onSearchChange,
  severity, onSeverityChange,
  category, onCategoryChange,
  status, onStatusChange,
  searchPlaceholder = "ابحث في الرسالة أو المسار...",
}: LogFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={{
            width: "100%", padding: "11px 44px 11px 14px", borderRadius: 12,
            border: "1.5px solid rgba(201,168,76,0.25)", background: "#fff",
            fontFamily: "Cairo,sans-serif", fontSize: 14, color: "#1A1208",
            outline: "none", direction: "rtl",
          }}
        />
        <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", fontSize: 17, pointerEvents: "none" }}>🔍</span>
      </div>

      <select value={severity} onChange={(e) => onSeverityChange(e.target.value)} style={selectStyle}>
        <option value="">كل المستويات</option>
        {LOG_SEVERITIES.map((s) => (
          <option key={s} value={s}>{SEVERITY_META[s].label}</option>
        ))}
      </select>

      <select value={category} onChange={(e) => onCategoryChange(e.target.value)} style={selectStyle}>
        <option value="">كل الفئات</option>
        {LOG_CATEGORIES.map((c) => (
          <option key={c} value={c}>{CATEGORY_META[c].label}</option>
        ))}
      </select>

      <select value={status} onChange={(e) => onStatusChange(e.target.value)} style={selectStyle}>
        <option value="unresolved">غير محلولة</option>
        <option value="resolved">محلولة</option>
        <option value="all">الكل</option>
      </select>
    </div>
  );
}
