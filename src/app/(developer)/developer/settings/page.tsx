"use client";
// src/app/(developer)/developer/settings/page.tsx
import { useState, useEffect } from "react";
import { m as motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";

interface ConfigCheck {
  key: string; label: string; status: "OK" | "WARNING" | "MISSING";
  message: string; category: string;
}
interface DeveloperSettingsData {
  theme: string; monitoringIntervalSec: number; aiProvider: string | null;
  incidentRetentionDays: number; dashboardDensity: string;
}
interface NotificationChannel {
  id: string; type: string; label: string; enabled: boolean; createdAt: string;
}

const STATUS_META: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  OK:      { color: "#1A6B47", bg: "rgba(26,107,71,0.1)",  icon: "✓", label: "سليم" },
  WARNING: { color: "#8B6914", bg: "rgba(201,168,76,0.14)", icon: "⚠", label: "تحذير" },
  MISSING: { color: "#B3261E", bg: "rgba(179,38,30,0.08)",  icon: "✕", label: "مفقود" },
};

const sectionTitle: React.CSSProperties = { fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 14 };
const selectStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)",
  background: "#fff", fontFamily: "Cairo,sans-serif", fontSize: 13, color: "#1A1208", outline: "none", direction: "rtl", cursor: "pointer",
};

export default function SettingsPage() {
  const toast = useToast();
  const qc = useQueryClient();

  // ---- Config Validator ----
  const { data: configData, isLoading: loadingConfig } = useQuery({
    queryKey: ["config-validator"],
    queryFn:  () => fetchWithAuth("/api/developer/config-validator"),
  });
  const checks: ConfigCheck[] = configData?.data?.checks ?? [];

  // ---- Developer Settings ----
  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["developer-settings"],
    queryFn:  () => fetchWithAuth("/api/developer/settings"),
  });
  const settings: DeveloperSettingsData | undefined = settingsData?.data;
  const [form, setForm] = useState<DeveloperSettingsData | null>(null);
  useEffect(() => { if (settings) setForm(settings); }, [settingsData]);

  const saveSettings = useMutation({
    mutationFn: (patch: Partial<DeveloperSettingsData>) =>
      fetchWithAuth("/api/developer/settings", { method: "PUT", body: JSON.stringify(patch) }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تم الحفظ"); qc.invalidateQueries({ queryKey: ["developer-settings"] }); }
      else toast.error(res.error ?? "فشل الحفظ");
    },
  });

  // ---- Notification Channels ----
  const { data: channelsData } = useQuery({
    queryKey: ["notification-channels"],
    queryFn:  () => fetchWithAuth("/api/developer/notification-channels"),
  });
  const channels: NotificationChannel[] = channelsData?.data?.channels ?? [];
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("WEBHOOK");

  const createChannel = useMutation({
    mutationFn: () => fetchWithAuth("/api/developer/notification-channels", {
      method: "POST", body: JSON.stringify({ type: newType, label: newLabel, config: {} }),
    }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تمت الإضافة"); setNewLabel(""); qc.invalidateQueries({ queryKey: ["notification-channels"] }); }
      else toast.error(res.error ?? "فشل الإضافة");
    },
  });

  const toggleChannel = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      fetchWithAuth(`/api/developer/notification-channels/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-channels"] }),
  });

  return (
    <div style={{ direction: "rtl" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 32, marginBottom: 4 }}>⚙️ الإعدادات</h1>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>فحص إعدادات المنصة، وتفضيلات لوحة المطور</p>
      </motion.div>

      {/* Config Validator */}
      <section className="mb-10">
        <h2 style={sectionTitle}>🩺 فحص إعدادات المنصة</h2>
        {loadingConfig && <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}</div>}
        {!loadingConfig && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            {checks.map((c, i) => {
              const meta = STATUS_META[c.status];
              return (
                <div key={c.key} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < checks.length - 1 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {meta.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, color: "#1A1208", fontSize: 13.5 }}>{c.label}</p>
                    <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, marginTop: 2 }}>{c.message}</p>
                  </div>
                  <span style={{ fontFamily: "Cairo,sans-serif", color: meta.color, fontSize: 11.5, fontWeight: 700 }}>{meta.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Developer Settings */}
      <section className="mb-10">
        <h2 style={sectionTitle}>🎛️ تفضيلات لوحة المطور</h2>
        {loadingSettings || !form ? (
          <div className="skeleton rounded-2xl h-52" />
        ) : (
          <div className="rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            <div>
              <label style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>المظهر</label>
              <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} style={{ ...selectStyle, width: "100%" }}>
                <option value="system">تلقائي (حسب النظام)</option><option value="light">فاتح</option><option value="dark">داكن</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>كثافة العرض</label>
              <select value={form.dashboardDensity} onChange={(e) => setForm({ ...form, dashboardDensity: e.target.value })} style={{ ...selectStyle, width: "100%" }}>
                <option value="comfortable">مريح</option><option value="compact">مضغوط</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>مزود الذكاء الاصطناعي المفضّل</label>
              <select value={form.aiProvider ?? ""} onChange={(e) => setForm({ ...form, aiProvider: e.target.value || null })} style={{ ...selectStyle, width: "100%" }}>
                <option value="">افتراضي (من إعدادات السيرفر)</option>
                <option value="claude">Claude</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                فترة تحديث المراقبة (ثواني): {form.monitoringIntervalSec}
              </label>
              <input type="range" min={5} max={300} value={form.monitoringIntervalSec}
                onChange={(e) => setForm({ ...form, monitoringIntervalSec: Number(e.target.value) })}
                style={{ width: "100%" }} />
            </div>
            <div className="sm:col-span-2">
              <label style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                الاحتفاظ بالحوادث (أيام): {form.incidentRetentionDays}
              </label>
              <input type="range" min={7} max={365} value={form.incidentRetentionDays}
                onChange={(e) => setForm({ ...form, incidentRetentionDays: Number(e.target.value) })}
                style={{ width: "100%" }} />
            </div>
            <div className="sm:col-span-2">
              <button
                onClick={() => saveSettings.mutate(form)}
                disabled={saveSettings.isPending}
                style={{ background: "#1A6B47", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 13.5, cursor: "pointer" }}
              >
                {saveSettings.isPending ? "جاري الحفظ..." : "حفظ التفضيلات"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notification Channels */}
      <section>
        <h2 style={sectionTitle}>🔔 قنوات الإشعارات (البنية التحتية فقط)</h2>
        <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 12.5, marginBottom: 14 }}>
          إضافة وتفعيل القنوات هنا لا يرسل أي إشعار فعلي بعد — هذا الجزء أساس لمهمة قادمة.
        </p>
        <div className="rounded-2xl p-5 mb-4" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="flex flex-wrap gap-3">
            <select value={newType} onChange={(e) => setNewType(e.target.value)} style={selectStyle}>
              <option value="EMAIL">Email</option><option value="TELEGRAM">Telegram</option>
              <option value="DISCORD">Discord</option><option value="SLACK">Slack</option><option value="WEBHOOK">Webhook</option>
            </select>
            <input
              value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="اسم القناة"
              style={{ flex: "1 1 200px", padding: "9px 14px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.25)", fontFamily: "Cairo,sans-serif", fontSize: 13, outline: "none", direction: "rtl" }}
            />
            <button
              onClick={() => createChannel.mutate()}
              disabled={newLabel.length < 1 || createChannel.isPending}
              style={{ background: "#C9A84C", color: "#1A1208", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontFamily: "Cairo,sans-serif", fontSize: 13, cursor: "pointer", opacity: newLabel.length < 1 ? 0.5 : 1 }}
            >
              + إضافة
            </button>
          </div>
        </div>

        {channels.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)" }}>
            {channels.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < channels.length - 1 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
                <span style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 11, fontWeight: 700, background: "rgba(201,168,76,0.1)", padding: "3px 8px", borderRadius: 8 }}>{c.type}</span>
                <p style={{ flex: 1, fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 13.5 }}>{c.label}</p>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={c.enabled} onChange={(e) => toggleChannel.mutate({ id: c.id, enabled: e.target.checked })} />
                  <span style={{ fontFamily: "Cairo,sans-serif", fontSize: 12, color: "#7A6E5A" }}>مفعّلة</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
