"use client";
// src/app/(admin)/error.tsx
// NEXT-001 FIX: see (student)/error.tsx for context — same gap existed here.
import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[(admin) error boundary]", error);
  }, [error]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
        <h2 style={{ color: "#1A6B47", fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
          حدث خطأ في هذه الصفحة
        </h2>
        <p style={{ color: "#6b6256", marginBottom: 20 }}>
          باقي أجزاء لوحة الإدارة شغالة بشكل طبيعي. حاول إعادة تحميل هذه الصفحة فقط.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{ background: "#1A6B47", color: "#fff", border: "none", borderRadius: 10, padding: "9px 22px", fontWeight: 600, cursor: "pointer" }}
          >
            إعادة المحاولة
          </button>
          <Link
            href="/admin"
            style={{ background: "#fff", color: "#1A6B47", border: "1px solid #1A6B47", borderRadius: 10, padding: "9px 22px", fontWeight: 600, textDecoration: "none" }}
          >
            لوحة الإدارة
          </Link>
        </div>
      </div>
    </div>
  );
}
