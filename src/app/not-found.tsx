// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#0D3D27,#1A6B47)", direction: "rtl" }}
    >
      <div className="text-center px-6">
        <div style={{ fontFamily: "Amiri,serif", color: "#C9A84C", fontSize: 120, lineHeight: 1, marginBottom: 16 }}>
          ٤٠٤
        </div>
        <h1 style={{ fontFamily: "Amiri,serif", color: "#E8C97A", fontSize: 32, marginBottom: 12 }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.6)", fontSize: 15, marginBottom: 32 }}>
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها
        </p>
        <Link
          href="/"
          style={{
            padding: "14px 36px", borderRadius: 14,
            background: "linear-gradient(135deg,#C9A84C,#8B6914)",
            color: "#1A1208", fontFamily: "Cairo,sans-serif",
            fontWeight: 700, fontSize: 15, textDecoration: "none",
            display: "inline-block",
          }}
        >
          🏠 العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
