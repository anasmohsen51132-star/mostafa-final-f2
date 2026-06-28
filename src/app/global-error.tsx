"use client";
// src/app/global-error.tsx
// NEXT-002 FIX: error.tsx does NOT catch errors thrown by the root layout
// itself (e.g. a Providers crash) — only global-error.tsx can, and it must
// render its own <html>/<body> since the root layout is what failed.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root layout error boundary]", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div
          style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#FAF7F0", padding: 24,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ color: "#1A6B47", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              تعذر تحميل المنصة
            </h1>
            <p style={{ color: "#6b6256", marginBottom: 24 }}>
              حدث خطأ غير متوقع. حاول إعادة تحميل الصفحة.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#1A6B47", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 28px", fontWeight: 600, cursor: "pointer",
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
