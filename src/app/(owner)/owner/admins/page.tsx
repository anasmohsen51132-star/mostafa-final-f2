"use client";
// src/app/(owner)/owner/admins/page.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";

export default function AdminsManagementPage() {
  const toast = useToast();
  const qc    = useQueryClient();

  const [showCreate,  setShowCreate]  = useState(false);
  const [newName,     setNewName]     = useState("");
  const [newPhone,    setNewPhone]    = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admins-list"],
    queryFn:  () => fetchWithAuth("/api/students?role=ADMIN&limit=100"),
  });

  // Fetch all non-student users (admins + owner)
  const { data: usersRes } = useQuery({
    queryKey: ["all-staff"],
    queryFn:  () => fetchWithAuth("/api/users/staff"),
  });

  const staffList: User[] = usersRes?.data ?? [];
  const admins = staffList.filter((u) => u.role === "ADMIN");

  const createAdmin = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: newName, phone: newPhone,
          password: newPassword,
          academicLevel: "FIRST_SECONDARY", // placeholder — overridden server-side for admins
          _forceRole: "ADMIN",
        }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        // Promote to admin
        return fetchWithAuth(`/api/users/${res.data.user.id}`, {
          method: "PUT", body: JSON.stringify({ role: "ADMIN" }),
        }).then(() => {
          toast.success("✅ تم إنشاء حساب المشرف");
          qc.invalidateQueries({ queryKey: ["all-staff"] });
          setShowCreate(false);
          setNewName(""); setNewPhone(""); setNewPassword("");
        });
      } else {
        toast.error(res.error ?? "فشل الإنشاء");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  const demoteAdmin = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/users/${id}`, {
        method: "PUT", body: JSON.stringify({ role: "STUDENT" }),
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("✅ تم تحويل المشرف إلى طالب");
        qc.invalidateQueries({ queryKey: ["all-staff"] });
      } else {
        toast.error(res.error ?? "فشل");
      }
    },
  });

  const handleCreate = () => {
    if (!newName.trim())                   { toast.error("أدخل اسم المشرف"); return; }
    if (!newPhone.trim())                  { toast.error("أدخل رقم الهاتف"); return; }
    if (!newPassword || newPassword.length < 6) { toast.error("كلمة المرور 6 أحرف على الأقل"); return; }
    createAdmin.mutate();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 13px", borderRadius: 11,
    border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 14,
    outline: "none", direction: "rtl", transition: "border-color 0.2s",
  };

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
            المشرفون
          </h1>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            {admins.length} مشرف نشط
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "11px 28px", borderRadius: 14,
            background: "linear-gradient(135deg,#C9A84C,#8B6914)",
            boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
            color: "#1A1208", fontFamily: "Cairo,sans-serif",
            fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
          }}
        >
          ＋ إضافة مشرف
        </button>
      </motion.div>

      {/* Admins list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-20" />)}
        </div>
      ) : admins.length > 0 ? (
        <div className="space-y-3">
          {admins.map((admin, i) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 p-5 rounded-2xl"
              style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.15)", boxShadow: "0 2px 8px rgba(26,18,8,0.04)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(45,158,107,0.2),rgba(26,107,71,0.2))", color: "#1A6B47" }}
              >
                {admin.avatar ?? admin.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ fontFamily: "Cairo,sans-serif", color: "#1A1208", fontSize: 15, fontWeight: 700 }}>
                    {admin.name}
                  </p>
                  <span style={{
                    padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: "rgba(45,158,107,0.1)", color: "#1A6B47",
                    fontFamily: "Cairo,sans-serif",
                  }}>
                    🔵 مشرف
                  </span>
                </div>
                <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 13 }}>
                  📱 {admin.phone} &nbsp;·&nbsp; انضم {formatDate(admin.joinedAt)}
                </p>
              </div>
              <button
                onClick={() => demoteAdmin.mutate(admin.id)}
                style={{
                  padding: "6px 16px", borderRadius: 10,
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#DC2626", background: "none",
                  fontFamily: "Cairo,sans-serif", fontSize: 12,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                إزالة
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.12)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔵</div>
          <h3 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 8 }}>
            لا يوجد مشرفون بعد
          </h3>
          <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A", fontSize: 14 }}>
            أضف مشرفين لمساعدتك في إدارة المنصة
          </p>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl p-7 max-w-md w-full"
              style={{ background: "#fff", direction: "rtl" }}
            >
              <h2 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 22, marginBottom: 20 }}>
                إنشاء حساب مشرف جديد
              </h2>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" }}>
                  الاسم الكامل
                </label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم المشرف" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" }}>
                  رقم الهاتف
                </label>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01xxxxxxxxx" style={inputStyle} type="tel"
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: "Cairo,sans-serif", color: "#4A3F2A", fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" }}>
                  كلمة المرور
                </label>
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل" type="password" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={createAdmin.isPending}
                  style={{
                    flex: 1, padding: "13px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#C9A84C,#8B6914)",
                    color: "#1A1208", fontFamily: "Cairo,sans-serif",
                    fontWeight: 700, fontSize: 14,
                    cursor: createAdmin.isPending ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(201,168,76,0.35)",
                  }}
                >
                  {createAdmin.isPending ? "⏳ جارٍ الإنشاء..." : "✅ إنشاء"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    padding: "13px 20px", borderRadius: 12,
                    border: "1px solid rgba(201,168,76,0.3)", background: "none",
                    color: "#8B6914", fontFamily: "Cairo,sans-serif",
                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
