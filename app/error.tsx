"use client";
// src/app/error.tsx
// NEXT-002 FIX: there was no error boundary at all below the root layout —
// any unhandled error in a page/component crashed to Next.js's generic,
// unbranded error screen with no recovery action for the user.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#FAF7F0", direction: "rtl", padding: 24 }}
    >
      <div
        className="text-center max-w-md"
        style={{ background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A6B47", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          حدث خطأ غير متوقع
        </h1>
        <p style={{ color: "#6b6256", marginBottom: 24, lineHeight: 1.6 }}>
          نعتذر عن هذا الخلل. حاول مرة أخرى، وإذا تكررت المشكلة تواصل مع الإدارة.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#1A6B47", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 28px", fontWeight: 600,
            cursor: "pointer", fontSize: 15,
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
