"use client";
// src/components/theme/ImageUploadField.tsx
import { useCallback, useRef, useState } from "react";
import { m as motion } from "framer-motion";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { ConfirmDialog } from "./ConfirmDialog";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 5;

// Reuses the exact same /api/upload endpoint + FormData pattern already
// used elsewhere in this app (quiz-builder image questions) — no new
// upload pipeline needed, just a new place for the resulting URL to go.
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", "image");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "فشل الرفع");
  return json.data.url as string;
}

interface Props {
  label: string;
  hint?: string;
  fieldKey: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  aspect?: string; // CSS aspect-ratio for the preview box, e.g. "16/9"
}

export function ImageUploadField({ label, hint, fieldKey, value, onChange, aspect = "16/9" }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (!ALLOWED.includes(file.type)) {
        toast.error("الصيغة غير مدعومة — PNG أو JPG أو WEBP فقط");
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`حجم الصورة أكبر من ${MAX_MB}MB`);
        return;
      }
      setUploading(true);
      try {
        const url = await uploadFile(file);
        onChange(url);
        toast.success("✅ تم رفع الصورة");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "فشل رفع الصورة");
      } finally {
        setUploading(false);
      }
    },
    [onChange, toast]
  );

  const confirmDelete = useCallback(async () => {
    setConfirmOpen(false);
    if (!value) return;
    try {
      const res = await fetchWithAuth("/api/owner/customize/delete-image", {
        method: "POST",
        body: JSON.stringify({ field: fieldKey, url: value }),
      });
      if (!res.success) throw new Error(res.error);
      onChange(null);
      toast.success("🗑️ تم حذف الصورة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل حذف الصورة");
    }
  }, [value, fieldKey, onChange, toast]);

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>
        {label}
      </label>
      {hint && (
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#A89A7E", fontSize: 11, marginBottom: 8 }}>{hint}</p>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative rounded-xl overflow-hidden cursor-pointer"
        style={{
          aspectRatio: aspect,
          border: `2px dashed ${dragOver ? "#C9A84C" : "rgba(201,168,76,0.3)"}`,
          background: dragOver ? "rgba(201,168,76,0.08)" : "#FAFAF8",
          transition: "all 0.15s",
        }}
        role="button"
        tabIndex={0}
        aria-label={`رفع صورة${label ? ` — ${label}` : ""}`}
        onKeyDown={(e) => {
          if (!uploading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100"
              style={{ background: "rgba(13,61,39,0.55)", transition: "opacity 0.15s" }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: "#fff", color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                🔄 استبدال
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: "#DC2626", color: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                🗑️ حذف
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
            {uploading ? (
              <>
                <motion.div
                  className="w-5 h-5 rounded-full border-2"
                  style={{ borderColor: "#C9A84C transparent #C9A84C transparent" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <span style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 12 }}>جارٍ الرفع...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 22 }}>🖼️</span>
                <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12 }}>
                  اسحب صورة هنا أو اضغط للاختيار
                </span>
                <span style={{ fontFamily: "Cairo,sans-serif", color: "#A89A7E", fontSize: 10 }}>
                  PNG · JPG · WEBP — حتى {MAX_MB}MB
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="حذف الصورة؟"
        description="هيتم حذف الصورة نهائيًا من التخزين ومن هذا الحقل. الإجراء ده لا يمكن التراجع عنه."
        confirmLabel="حذف نهائي"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
