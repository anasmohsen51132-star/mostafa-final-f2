"use client";
// src/app/(admin)/admin/announcement/page.tsx
import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { ConfirmDialog } from "@/components/theme/ConfirmDialog";
import type { SiteSettings } from "@/types";

export default function AnnouncementPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [enabled, setEnabled]         = useState(false);
  const [title, setTitle]             = useState("");
  const [text, setText]               = useState("");
  const [link, setLink]               = useState("");
  const [dismissible, setDismissible] = useState(true);
  const [isDirty, setIsDirty]         = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchWithAuth("/api/customize"),
  });

  useEffect(() => {
    const s: SiteSettings | undefined = data?.data;
    if (!s) return;
    setEnabled(s.announcementEnabled ?? false);
    setTitle(s.announcementTitle ?? "");
    setText(s.announcementText ?? "");
    setLink(s.announcementLink ?? "");
    setDismissible(s.announcementDismissible ?? true);
    setIsDirty(false);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/admin/announcement", {
        method: "PUT",
        body: JSON.stringify({
          enabled,
          title: title || null,
          text: text || null,
          link: link || null,
          dismissible,
        }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم حفظ الإعلان");
        qc.invalidateQueries({ queryKey: ["site-settings"] });
        setIsDirty(false);
      } else {
        toast.error(res.error ?? "فشل الحفظ");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchWithAuth("/api/admin/announcement", { method: "DELETE" }),
    onSuccess: (res) => {
      setConfirmOpen(false);
      if (res.success) {
        toast.success("🗑️ تم حذف الإعلان");
        setEnabled(false); setTitle(""); setText(""); setLink("");
        qc.invalidateQueries({ queryKey: ["site-settings"] });
        setIsDirty(false);
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
    },
    onError: () => { setConfirmOpen(false); toast.error("حدث خطأ في الاتصال"); },
  });

  const mark = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setIsDirty(true); };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 11,
    border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 14,
    outline: "none", direction: "rtl",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600,
    marginBottom: 5, display: "block",
  };

  const hasContent = !!(title.trim() || text.trim());

  if (isLoading) {
    return <div className="skeleton rounded-2xl h-64" />;
  }

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 28, marginBottom: 4 }}>
          📢 الإعلان الشريطي
        </h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
          شريط إعلان بيظهر أعلى كل صفحات المنصة — للطلاب وللزوار كمان
        </p>
      </motion.div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="flex-1 rounded-2xl p-7"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 16px rgba(26,18,8,0.05)" }}>

          <div className="flex items-center justify-between mb-6 p-3 rounded-xl" style={{ background: "rgba(201,168,76,0.06)" }}>
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 14, fontWeight: 700 }}>
              تفعيل الإعلان
            </span>
            <label style={{ position: "relative", display: "inline-block", width: 46, height: 26, cursor: "pointer" }}>
              <input type="checkbox" checked={enabled} onChange={(e) => mark(setEnabled)(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: "absolute", inset: 0, borderRadius: 999,
                background: enabled ? "#1A6B47" : "rgba(122,110,90,0.3)", transition: "background 0.2s",
              }}>
                <span style={{
                  position: "absolute", top: 3, left: enabled ? 3 : 23, width: 20, height: 20,
                  borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                }} />
              </span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>العنوان (نص بارز، اختياري رابط)</label>
            <input value={title} onChange={(e) => mark(setTitle)(e.target.value)}
              placeholder="مثال: كن فريدًا يا فتى ♥" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>النص التوضيحي</label>
            <textarea value={text} onChange={(e) => mark(setText)(e.target.value)}
              placeholder="مثال: انضم الآن واستفد من خصم افتتاح المنصة"
              rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>رابط عند الضغط على العنوان (اختياري)</label>
            <input value={link} onChange={(e) => mark(setLink)(e.target.value)}
              placeholder="/register أو رابط كامل" style={{ ...inputStyle, direction: "ltr" }} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none mb-6">
            <input type="checkbox" checked={dismissible} onChange={(e) => mark(setDismissible)(e.target.checked)} />
            <span style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 13 }}>
              يقدر الطالب يقفل الإعلان (زرار ✕)
            </span>
          </label>

          <div className="flex gap-3 flex-wrap">
            <motion.button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isDirty}
              whileHover={isDirty ? { y: -2 } : {}}
              style={{
                padding: "11px 26px", borderRadius: 12, border: "none",
                background: !isDirty ? "rgba(201,168,76,0.25)" : "linear-gradient(135deg,#C9A84C,#8B6914)",
                color: "#1A1208", fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: 14,
                cursor: !isDirty ? "default" : "pointer",
              }}
            >
              {saveMutation.isPending ? "⏳ جارٍ الحفظ..." : "💾 حفظ"}
            </motion.button>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMutation.isPending}
              style={{
                padding: "11px 22px", borderRadius: 12, border: "1.5px solid rgba(220,38,38,0.3)",
                background: "transparent", color: "#DC2626", fontFamily: "Cairo,sans-serif",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              🗑️ حذف الإعلان نهائيًا
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:w-80 flex-shrink-0">
          <p style={labelStyle}>معاينة</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
            {enabled && hasContent ? (
              <div style={{ background: "linear-gradient(90deg,#0D3D27,#1A6B47)" }} className="relative px-6 py-4 text-center">
                {dismissible && <span className="absolute" style={{ left: 10, top: 10, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>✕</span>}
                {title && <div style={{ fontFamily: "Cairo,sans-serif", color: "#E8C97A", fontWeight: 700, fontSize: 13, textDecoration: link ? "underline" : "none" }}>{title}</div>}
                {text && <div style={{ fontFamily: "Cairo,sans-serif", color: "rgba(255,255,255,0.85)", fontSize: 11.5, marginTop: 2 }}>{text}</div>}
              </div>
            ) : (
              <div className="p-6 text-center" style={{ background: "#FAFAF8" }}>
                <span style={{ fontFamily: "Cairo,sans-serif", color: "#A89A7E", fontSize: 12 }}>
                  {enabled ? "اكتب عنوان أو نص عشان تشوف المعاينة" : "الإعلان متوقف حاليًا"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="حذف الإعلان نهائيًا؟"
        description="هيتم مسح العنوان والنص والرابط، والإعلان هيختفي من كل صفحات المنصة فورًا."
        confirmLabel="حذف نهائي"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
