"use client";
// src/app/(owner)/owner/customize/page.tsx
import { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import type { SiteSettings } from "@/types";

type Section = "hero" | "teacher" | "branding" | "dashboard" | "colors";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "hero",      label: "الصفحة الرئيسية",  icon: "🏠" },
  { id: "teacher",   label: "معلومات الأستاذ",   icon: "👨‍🏫" },
  { id: "branding",  label: "هوية المنصة",        icon: "🏷️" },
  { id: "dashboard", label: "لوحة الطالب",        icon: "📊" },
  { id: "colors",    label: "الألوان",             icon: "🎨" },
];

export default function CustomizePage() {
  const toast = useToast();
  const qc    = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>("hero");
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn:  () => fetchWithAuth("/api/customize"),
  });

  useEffect(() => {
    if (data?.data) {
      // BUGFIX: id/updatedAt are system-managed (not part of the editable
      // schema) — keeping them out of form state means they can never be
      // sent back on save, which is what broke every save after
      // siteSettingsSchema became `.strict()` (SEC-010 fix).
      const { id: _id, updatedAt: _updatedAt, ...editable } = data.data;
      setForm(editable);
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/customize", {
        method: "PUT",
        body: JSON.stringify(form),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم حفظ الإعدادات بنجاح");
        qc.invalidateQueries({ queryKey: ["site-settings"] });
        setIsDirty(false);
      } else {
        toast.error(res.error ?? "فشل الحفظ");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const update = (key: keyof SiteSettings, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 11,
    border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 14,
    outline: "none", direction: "rtl", transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "Cairo,sans-serif", color: "#4A3F2A",
    fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "rgba(201,168,76,0.65)");
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "rgba(201,168,76,0.25)");

  const Field = ({
    label, field, multiline = false, placeholder = "",
  }: {
    label: string; field: keyof SiteSettings; multiline?: boolean; placeholder?: string;
  }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea
          value={(form[field] as string) ?? ""}
          onChange={(e) => update(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={onFocus} onBlur={onBlur}
        />
      ) : (
        <input
          type="text"
          value={(form[field] as string) ?? ""}
          onChange={(e) => update(field, e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
          onFocus={onFocus} onBlur={onBlur}
        />
      )}
    </div>
  );

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>
            🎨 تخصيص المنصة
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            عدّل جميع نصوص وألوان المنصة بدون كود
          </p>
        </div>

        {isDirty && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{
              padding: "11px 28px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg,#C9A84C,#8B6914)",
              boxShadow: "0 4px 16px rgba(201,168,76,0.4)",
              color: "#1A1208", fontFamily: "Cairo,sans-serif",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}
          >
            {saveMutation.isPending ? "⏳ جارٍ الحفظ..." : "💾 حفظ التغييرات"}
          </motion.button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-16" />)}
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">

          {/* Section nav */}
          <div className="flex-shrink-0 lg:w-52">
            <div className="space-y-1 sticky top-6">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all"
                  style={{
                    border: "none",
                    background: activeSection === s.id ? "rgba(201,168,76,0.12)" : "transparent",
                    borderRight: activeSection === s.id ? "3px solid #C9A84C" : "3px solid transparent",
                    color: activeSection === s.id ? "#8B6914" : "#7A6E5A",
                    fontFamily: "Cairo,sans-serif", fontSize: 14,
                    fontWeight: activeSection === s.id ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl p-7"
                style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 16px rgba(26,18,8,0.05)" }}
              >

                {/* ── HERO SECTION ── */}
                {activeSection === "hero" && (
                  <div>
                    <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20 }}>
                      🏠 إعدادات الصفحة الرئيسية
                    </h2>
                    <Field label="العنوان الرئيسي"       field="heroTitle"    placeholder="اتقن اللغة العربية" />
                    <Field label="العنوان الفرعي"         field="heroSubtitle" placeholder="مع نخبة من أفضل الأساتذة" />
                    <Field label="وصف الصفحة الرئيسية"   field="heroDesc"     placeholder="انضم إلى آلاف الطلاب..." multiline />
                    <Field label="نص تذييل الصفحة"        field="footerText"   placeholder="© ٢٠٢٤ اكاديمية..." />
                  </div>
                )}

                {/* ── TEACHER SECTION ── */}
                {activeSection === "teacher" && (
                  <div>
                    <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20 }}>
                      👨‍🏫 معلومات الأستاذ
                    </h2>
                    <Field label="اسم الأستاذ"    field="teacherName"  placeholder="مستر مصطفى" />
                    <Field label="لقب / تخصص"     field="teacherTitle" placeholder="خبير تدريس اللغة العربية" />
                    <Field label="نبذة عن الأستاذ" field="teacherBio"   placeholder="معلم متميز بخبرة..." multiline />
                  </div>
                )}

                {/* ── BRANDING SECTION ── */}
                {activeSection === "branding" && (
                  <div>
                    <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20 }}>
                      🏷️ هوية المنصة
                    </h2>
                    <Field label="اسم المنصة"    field="platformName"    placeholder="اكاديمية مستر مصطفى" />
                    <Field label="شعار / وصف"    field="platformTagline" placeholder="لتدريس اللغة العربية" />
                  </div>
                )}

                {/* ── DASHBOARD SECTION ── */}
                {activeSection === "dashboard" && (
                  <div>
                    <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20 }}>
                      📊 لوحة تحكم الطالب
                    </h2>
                    <Field label="رسالة الترحيب" field="dashboardWelcome" placeholder="أهلاً وسهلاً بك في منصتك التعليمية" multiline />
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>رابط صورة البانر (اختياري)</label>
                      <input
                        type="url"
                        value={(form.dashboardBanner as string) ?? ""}
                        onChange={(e) => update("dashboardBanner", e.target.value)}
                        placeholder="https://..."
                        style={{ ...inputStyle, direction: "ltr" }}
                        onFocus={onFocus} onBlur={onBlur}
                      />
                      {form.dashboardBanner && (
                        <img
                          src={form.dashboardBanner}
                          alt="بانر"
                          className="mt-2 rounded-xl w-full object-cover max-h-32"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* ── COLORS SECTION ── */}
                {activeSection === "colors" && (
                  <div>
                    <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20 }}>
                      🎨 ألوان المنصة
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { label: "اللون الرئيسي (الذهبي)",  field: "primaryColor" as keyof SiteSettings, current: form.primaryColor ?? "#C9A84C" },
                        { label: "اللون الثانوي (الأخضر)", field: "accentColor"  as keyof SiteSettings, current: form.accentColor  ?? "#1A6B47" },
                      ].map(({ label, field, current }) => (
                        <div key={field}>
                          <label style={labelStyle}>{label}</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={current}
                              onChange={(e) => update(field, e.target.value)}
                              style={{ width: 48, height: 48, borderRadius: 12, border: "2px solid rgba(201,168,76,0.3)", cursor: "pointer", padding: 2 }}
                            />
                            <input
                              type="text"
                              value={current}
                              onChange={(e) => update(field, e.target.value)}
                              style={{ ...inputStyle, flex: 1, direction: "ltr" }}
                              onFocus={onFocus} onBlur={onBlur}
                            />
                          </div>
                          {/* Live preview */}
                          <div className="mt-3 rounded-xl p-4 text-center"
                            style={{ background: current, color: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 13 }}>
                            معاينة اللون
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      className="mt-6 p-4 rounded-xl"
                      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
                    >
                      <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 13 }}>
                        💡 تأثير تغيير الألوان يظهر على الصفحة الرئيسية وصفحات الدخول بعد الحفظ وإعادة التحميل.
                      </p>
                    </div>
                  </div>
                )}

                {/* Save button inside card */}
                <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}>
                  <motion.button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !isDirty}
                    whileHover={!saveMutation.isPending && isDirty ? { y: -2 } : {}}
                    whileTap={!saveMutation.isPending && isDirty ? { scale: 0.98 } : {}}
                    style={{
                      padding: "12px 32px", borderRadius: 12, border: "none",
                      background: !isDirty ? "rgba(201,168,76,0.25)" : "linear-gradient(135deg,#C9A84C,#8B6914)",
                      boxShadow: isDirty ? "0 4px 16px rgba(201,168,76,0.35)" : "none",
                      color: "#1A1208", fontFamily: "Cairo,sans-serif",
                      fontWeight: 700, fontSize: 14,
                      cursor: !isDirty ? "default" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {saveMutation.isPending ? "⏳ جارٍ الحفظ..." : isDirty ? "💾 حفظ هذا القسم" : "✅ محفوظ"}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
