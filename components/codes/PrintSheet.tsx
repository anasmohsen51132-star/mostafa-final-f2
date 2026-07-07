"use client";
// src/components/codes/PrintSheet.tsx
// Usage: render this component, then call window.print()
// The @media print CSS hides everything except .print-sheet

import type { AccessCode } from "@/types";

interface Props {
  codes: AccessCode[];
  platformName?: string;
}

export function PrintSheet({ codes, platformName = "اكاديمية مستر مصطفى" }: Props) {
  return (
    <>
      {/* Print-only styles injected as a style tag */}
      <style>{`
        @media print {
          body > *:not(#print-sheet-root) { display: none !important; }
          #print-sheet-root { display: block !important; }
          @page { margin: 10mm; size: A4 portrait; }
        }
        #print-sheet-root { display: none; }
        #print-sheet-root.visible { display: block; }
      `}</style>

      <div id="print-sheet-root" className="visible"
        style={{
          direction: "rtl",
          fontFamily: "Cairo, Tajawal, sans-serif",
          background: "#fff",
          padding: "8mm",
        }}
      >
        {/* Sheet header */}
        <div style={{ textAlign: "center", marginBottom: 16, borderBottom: "2px solid #C9A84C", paddingBottom: 8 }}>
          <p style={{ fontFamily: "Amiri, serif", fontSize: 18, color: "#1A6B47", fontWeight: 700 }}>
            {platformName}
          </p>
          <p style={{ fontSize: 11, color: "#7A6E5A", marginTop: 2 }}>
            كودات الوصول — {codes.length} كود
          </p>
        </div>

        {/* Cards grid — 3 per row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6mm",
        }}>
          {codes.map((c) => (
            <div
              key={c.id}
              style={{
                border: "1.5px solid #C9A84C",
                borderRadius: 8,
                padding: "6mm 5mm",
                textAlign: "center",
                pageBreakInside: "avoid",
                background: "#FFFDF7",
              }}
            >
              {/* Platform name */}
              <p style={{ fontFamily: "Amiri, serif", fontSize: 10, color: "#C9A84C", marginBottom: 4, fontWeight: 700 }}>
                {platformName}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(201,168,76,0.3)", marginBottom: 6 }} />

              {/* Course name */}
              <p style={{ fontSize: 9, color: "#4A3F2A", marginBottom: 6, lineHeight: 1.4 }}>
                {c.courses?.map((cc) => cc.course.title).join("، ") ?? ""}
              </p>

              {/* CODE */}
              <div style={{
                background: "linear-gradient(135deg,#0D3D27,#1A6B47)",
                borderRadius: 6,
                padding: "6px 4px",
                marginBottom: 6,
              }}>
                <p style={{
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#E8C97A",
                  letterSpacing: "0.12em",
                }}>
                  {c.code}
                </p>
              </div>

              {/* Expiry */}
              {c.expiresAt && (
                <p style={{ fontSize: 8, color: "#DC2626", marginTop: 4 }}>
                  ينتهي في: {new Date(c.expiresAt).toLocaleDateString("ar-EG")}
                </p>
              )}

              {/* Instructions */}
              <p style={{ fontSize: 7.5, color: "#7A6E5A", marginTop: 4, lineHeight: 1.5 }}>
                يُستخدم مرة واحدة فقط · للتفعيل اذهب لصفحة «استخدام كود»
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, textAlign: "center", borderTop: "1px solid rgba(201,168,76,0.2)", paddingTop: 6 }}>
          <p style={{ fontSize: 8, color: "#7A6E5A" }}>
            جميع الكودات أُنشئت بتاريخ {new Date().toLocaleDateString("ar-EG")} — محمية ومخصصة للاستخدام الشخصي
          </p>
        </div>
      </div>
    </>
  );
}
