"use client";
// src/app/(owner)/owner/customize/page.tsx
//
// Full rebuild (see chat audit for the "before" state and rationale).
// Reuses this app's existing conventions rather than inventing new ones:
// react-query for data, useToast for feedback, framer-motion for section
// transitions, fetchWithAuth for JSON mutations, and the plain
// fetch+FormData pattern already used for image uploads elsewhere.
import { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { ImageUploadField } from "@/components/theme/ImageUploadField";
import { CtaButtonsEditor } from "@/components/theme/CtaButtonsEditor";
import type { SiteSettings, CtaButton } from "@/types";

type Section = "hero" | "teacher" | "branding" | "dashboard" | "colors" | "landing" | "seo";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "hero",      label: "الصفحة الرئيسية", icon: "🏠" },
  { id: "landing",   label: "صور وأزرار الهبوط", icon: "🖼️" },
  { id: "teacher",   label: "معلومات الأستاذ",  icon: "👨‍🏫" },
  { id: "branding",  label: "هوية المنصة",       icon: "🏷️" },
  { id: "dashboard", label: "لوحة الطالب",       icon: "📊" },
  { id: "colors",    label: "الألوان",           icon: "🎨" },
  { id: "seo",       label: "SEO ومشاركة",       icon: "🔎" },
];

const COLOR_FIELDS: { label: string; field: keyof SiteSettings; fallback: string }[] = [
  { label: "اللون الرئيسي",   field: "primaryColor",    fallback: "#C9A84C" },
  { label: "اللون الثانوي",   field: "secondaryColor",  fallback: "#1A6B47" },
  { label: "لون التمييز",     field: "accentColor",     fallback: "#1A6B47" },
  { label: "لون الخلفية",     field: "backgroundColor", fallback: "#F5F1E8" },
  { label: "لون البطاقات",    field: "surfaceColor",    fallback: "#FFFFFF" },
  { label: "لون النص",        field: "textColor",       fallback: "#1A1208" },
  { label: "لون الأزرار",     field: "buttonColor",     fallback: "#C9A84C" },
  { label: "لون التحويم",     field: "hoverColor",      fallback: "#8B6914" },
  { label: "لون النجاح",      field: "successColor",    fallback: "#16A34A" },
  { label: "لون التحذير",     field: "warningColor",    fallback: "#D97706" },
  { label: "لون الخطأ",       field: "errorColor",      fallback: "#DC2626" },
];

export default function CustomizePage() {
  const toast = useToast();
  const qc    = useQueryClient();
  const [activeSection, setActiveSection] = useState<Section>("hero");
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  // GET stays public/unauthenticated-friendly at /api/customize — see that
  // route's own comment for why. This page is already behind the (owner)
  // route group + middleware, so reading it here is fine either way.
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn:  () => fetchWithAuth("/api/customize"),
  });

  useEffect(() => {
    if (data?.data) {
      const { id: _id, updatedAt: _updatedAt, ...editable } = data.data;
      setForm(editable);
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/owner/customize", {
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

  const update = (key: keyof SiteSettings, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  };

  // Image fields save immediately on upload/delete (not batched with the
  // rest of the form) — this matches user expectation for drag-drop
  // uploaders (the image is "just there" once dropped) and means a lost
  // upload never depends on the owner remembering to hit the main Save
  // button afterward.
  const saveImageField = async (key: keyof SiteSettings, url: string | null) => {
    update(key, url);
    const res = await fetchWithAuth("/api/owner/customize", {
      method: "PUT",
      body: JSON.stringify({ ...form, [key]: url }),
    });
    if (res.success) {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      setIsDirty(false);
    } else {
      toast.error(res.error ?? "فشل حفظ الصورة");
    }
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
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 20, marginBottom: 20,
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
            عدّل كل نصوص وألوان وصور المنصة بدون كود
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
                    <h2 style={sectionTitleStyle}>🏠 إعدادات الصفحة الرئيسية</h2>
                    <Field label="العنوان الرئيسي"     field="heroTitle"    placeholder="اتقن اللغة العربية" />
                    <Field label="العنوان الفرعي"       field="heroSubtitle" placeholder="مع نخبة من أفضل الأساتذة" />
                    <Field label="وصف الصفحة الرئيسية" field="heroDesc"     placeholder="انضم إلى آلاف الطلاب..." multiline />
                    <Field label="نص تذييل الصفحة"      field="footerText"   placeholder="© ٢٠٢٤ اكاديمية..." />
                  </div>
                )}

                {/* ── LANDING (images + CTA buttons) ── */}
                {activeSection === "landing" && (
                  <div>
                    <h2 style={sectionTitleStyle}>🖼️ صور وأزرار صفحة الهبوط</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                      <ImageUploadField
                        label="خلفية القسم الرئيسي" fieldKey="heroBackgroundImage"
                        value={form.heroBackgroundImage} aspect="16/9"
                        onChange={(url) => saveImageField("heroBackgroundImage", url)}
                      />
                      <ImageUploadField
                        label="الرسم التوضيحي الرئيسي" fieldKey="heroIllustration"
                        value={form.heroIllustration} aspect="4/3"
                        onChange={(url) => saveImageField("heroIllustration", url)}
                      />
                      <ImageUploadField
                        label="بانر ترويجي" fieldKey="heroBanner"
                        value={form.heroBanner} aspect="21/9"
                        onChange={(url) => saveImageField("heroBanner", url)}
                      />
                    </div>

                    <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 16, marginBottom: 4 }}>
                      أزرار الدعوة لاتخاذ إجراء (CTA)
                    </h3>
                    <p style={{ fontFamily: "Cairo,sans-serif", color: "#A89A7E", fontSize: 12, marginBottom: 14 }}>
                      رتّب الأزرار بالأسهم، أو أخفِ زرار بدون حذفه من غير ما تفقد إعداداته.
                    </p>
                    <CtaButtonsEditor
                      buttons={(form.ctaButtons as CtaButton[]) ?? []}
                      onChange={(btns) => update("ctaButtons", btns)}
                    />
                  </div>
                )}

                {/* ── TEACHER SECTION ── */}
                {activeSection === "teacher" && (
                  <div>
                    <h2 style={sectionTitleStyle}>👨‍🏫 معلومات الأستاذ</h2>
                    <Field label="اسم الأستاذ"     field="teacherName"  placeholder="مستر مصطفى" />
                    <Field label="لقب / تخصص"       field="teacherTitle" placeholder="خبير تدريس اللغة العربية" />
                    <Field label="نبذة عن الأستاذ"  field="teacherBio"   placeholder="معلم متميز بخبرة..." multiline />
                  </div>
                )}

                {/* ── BRANDING SECTION ── */}
                {activeSection === "branding" && (
                  <div>
                    <h2 style={sectionTitleStyle}>🏷️ هوية المنصة</h2>
                    <Field label="اسم المنصة" field="platformName"    placeholder="اكاديمية مستر مصطفى" />
                    <Field label="شعار / وصف" field="platformTagline" placeholder="لتدريس اللغة العربية" />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-2">
                      <ImageUploadField
                        label="شعار الهيدر" fieldKey="headerLogo"
                        value={form.headerLogo} aspect="1/1"
                        onChange={(url) => saveImageField("headerLogo", url)}
                      />
                      <ImageUploadField
                        label="شعار صفحة الدخول" fieldKey="loginLogo"
                        value={form.loginLogo} aspect="1/1"
                        onChange={(url) => saveImageField("loginLogo", url)}
                      />
                      <ImageUploadField
                        label="أيقونة المتصفح (Favicon)" fieldKey="faviconImage"
                        value={form.faviconImage} aspect="1/1"
                        onChange={(url) => saveImageField("faviconImage", url)}
                        hint="مربّعة، 512×512 مثاليًا"
                      />
                    </div>
                    <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
                      <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 12 }}>
                        💡 أيقونة المتصفح الفعلية بتتحدد حاليًا من ملف ثابت في المشروع. رفع صورة هنا بيخزّنها للاستخدام المستقبلي، وربطها الفعلي بأيقونة المتصفح محتاج خطوة تطوير إضافية (موضّحة في تقرير المراجعة).
                      </p>
                    </div>
                  </div>
                )}

                {/* ── DASHBOARD SECTION ── */}
                {activeSection === "dashboard" && (
                  <div>
                    <h2 style={sectionTitleStyle}>📊 لوحة تحكم الطالب</h2>
                    <Field label="رسالة الترحيب" field="dashboardWelcome" placeholder="أهلاً وسهلاً بك في منصتك التعليمية" multiline />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                      <ImageUploadField
                        label="بانر لوحة الطالب" fieldKey="dashboardBanner"
                        value={form.dashboardBanner} aspect="21/9"
                        onChange={(url) => saveImageField("dashboardBanner", url)}
                      />
                      <ImageUploadField
                        label="صورة قسم الترحيب" fieldKey="welcomeSectionImage"
                        value={form.welcomeSectionImage} aspect="4/3"
                        onChange={(url) => saveImageField("welcomeSectionImage", url)}
                      />
                      <ImageUploadField
                        label="صورة زخرفية" fieldKey="dashboardDecorImage"
                        value={form.dashboardDecorImage} aspect="1/1"
                        onChange={(url) => saveImageField("dashboardDecorImage", url)}
                      />
                    </div>
                  </div>
                )}

                {/* ── COLORS SECTION ── */}
                {activeSection === "colors" && (
                  <div>
                    <h2 style={sectionTitleStyle}>🎨 ألوان المنصة</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {COLOR_FIELDS.map(({ label, field, fallback }) => {
                        const current = (form[field] as string) ?? fallback;
                        return (
                          <div key={field}>
                            <label style={labelStyle}>{label}</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={current}
                                onChange={(e) => update(field, e.target.value)}
                                style={{ width: 44, height: 44, borderRadius: 11, border: "2px solid rgba(201,168,76,0.3)", cursor: "pointer", padding: 2 }}
                              />
                              <input
                                type="text"
                                value={current}
                                onChange={(e) => update(field, e.target.value)}
                                style={{ ...inputStyle, flex: 1, direction: "ltr" }}
                                onFocus={onFocus} onBlur={onBlur}
                              />
                            </div>
                            <div className="mt-2 rounded-lg py-2 text-center"
                              style={{ background: current, color: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 12 }}>
                              معاينة
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
                      <p style={{ fontFamily: "Cairo,sans-serif", color: "#8B6914", fontSize: 13 }}>
                        💡 هذه القيم متاحة فورًا كمتغيرات CSS (<code>--color-primary</code> إلخ) في كل الموقع بعد الحفظ.
                        استخدامها الفعلي داخل كل شاشة موجودة مسبقًا في المنصة محتاج نقل تدريجي — تفاصيل ده في تقرير المراجعة.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── SEO SECTION ── */}
                {activeSection === "seo" && (
                  <div>
                    <h2 style={sectionTitleStyle}>🔎 محركات البحث والمشاركة</h2>
                    <Field label="عنوان المتصفح (Meta Title)" field="metaTitle" placeholder="اكاديمية مستر مصطفى" />
                    <Field label="وصف الصفحة (Meta Description)" field="metaDescription" placeholder="وصف قصير يظهر في نتائج البحث" multiline />
                    <Field label="كلمات مفتاحية (مفصولة بفاصلة)" field="metaKeywords" placeholder="اللغة العربية, ثانوية عامة, ..." />

                    <div className="mt-2">
                      <ImageUploadField
                        label="صورة المشاركة (Open Graph)" fieldKey="ogImage"
                        value={form.ogImage} aspect="1200/630"
                        onChange={(url) => saveImageField("ogImage", url)}
                        hint="اللي بتظهر لما حد يشارك رابط الموقع على واتساب/فيسبوك — 1200×630 مثاليًا"
                      />
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
