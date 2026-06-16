"use client";
// src/components/courses/PDFViewer.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import type { PDF } from "@/types";

interface Props {
  pdfs: PDF[];
}

export function PDFViewer({ pdfs }: Props) {
  const [selected, setSelected] = useState<PDF | null>(null);

  if (!pdfs.length) return null;

  return (
    <div>
      {/* PDF list */}
      <div className="space-y-3 mb-4">
        {pdfs.map((pdf) => (
          <motion.div
            key={pdf.id}
            whileHover={{ x: -4 }}
            className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer"
            style={{
              background: selected?.id === pdf.id ? "rgba(201,168,76,0.06)" : "#fff",
              border: `1.5px solid ${selected?.id === pdf.id ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.15)"}`,
              transition: "all 0.15s",
            }}
            onClick={() => setSelected(selected?.id === pdf.id ? null : pdf)}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.1)" }}
            >
              📄
            </div>
            <div className="flex-1">
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 600 }}>
                {pdf.title}
              </p>
              <p style={{ fontFamily: "Cairo,sans-serif", color: "#C9A84C", fontSize: 12, marginTop: 1 }}>
                {selected?.id === pdf.id ? "اضغط لإغلاق" : "اضغط للعرض"}
              </p>
            </div>
            <a
              href={pdf.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "5px 14px", borderRadius: 9,
                border: "1px solid rgba(201,168,76,0.3)",
                color: "#8B6914", fontFamily: "Cairo,sans-serif",
                fontSize: 12, fontWeight: 600, textDecoration: "none",
                flexShrink: 0,
              }}
            >
              تحميل ↗
            </a>
          </motion.div>
        ))}
      </div>

      {/* Inline viewer */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "rgba(201,168,76,0.06)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}
          >
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 13, fontWeight: 600 }}>
              📄 {selected.title}
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#7A6E5A", fontSize: 18, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <iframe
            src={`${selected.fileUrl}#toolbar=0`}
            title={selected.title}
            style={{ width: "100%", height: 600, border: "none", display: "block" }}
          />
        </motion.div>
      )}
    </div>
  );
}
