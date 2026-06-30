"use client";
// src/components/auth/RegisterForm.tsx
import { useState } from "react";
import { m as motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ACADEMIC_LEVEL_LABELS, ACADEMIC_LEVELS, type AcademicLevel } from "@/types";

export function RegisterForm() {
  const { register, isRegisterLoading } = useAuth();
  const [name,           setName]           = useState("");
  const [phone,          setPhone]          = useState("");
  const [password,       setPassword]       = useState("");
  const [academicLevel,  setAcademicLevel]  = useState<AcademicLevel | "">("");
  const [showPass,       setShowPass]       = useState(false);
  const [localError,     setLocalError]     = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!name.trim())        { setLocalError("أدخل اسمك الكامل"); return; }
    if (name.trim().length < 2) { setLocalError("الاسم يجب أن يكون حرفين على الأقل"); return; }
    if (!phone.trim())       { setLocalError("أدخل رقم الهاتف"); return; }
    if (!password)           { setLocalError("أدخل كلمة المرور"); return; }
    if (password.length < 6) { setLocalError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (!academicLevel)      { setLocalError("اختر مرحلتك الدراسية"); return; }
    register({ name: name.trim(), phone: phone.trim(), password, academicLevel });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 44px 13px 14px", borderRadius: 12,
    border: "1.5px solid rgba(201,168,76,0.25)",
    background: "rgba(250,247,240,0.06)", color: "#FAF7F0",
    fontFamily: "Cairo,sans-serif", fontSize: 14, outline: "none",
    direction: "rtl", transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.7)",
    fontSize: 12, marginBottom: 5, display: "block",
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "rgba(201,168,76,0.65)");
  const blurBorder  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "rgba(201,168,76,0.25)");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit} noValidate style={{ direction: "rtl" }}>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="reg-name" style={labelStyle}>👤 الاسم الكامل</label>
          <div style={{ position: "relative" }}>
            <input id="reg-name" type="text" autoComplete="name"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل" style={inputStyle}
              onFocus={focusBorder} onBlur={blurBorder}
            />
            <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:17,pointerEvents:"none" }}>👤</span>
          </div>
        </div>

        {/* Academic Level */}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="reg-level" style={labelStyle}>🎓 المرحلة الدراسية</label>
          <div style={{ position: "relative" }}>
            <select
              id="reg-level"
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
              style={{
                ...inputStyle,
                padding: "13px 44px 13px 14px",
                cursor: "pointer",
                appearance: "none",
              }}
              onFocus={focusBorder} onBlur={blurBorder}
            >
              <option value="" disabled style={{ background: "#0D3D27" }}>اختر مرحلتك الدراسية</option>
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl} style={{ background: "#0D3D27", color: "#FAF7F0" }}>
                  {ACADEMIC_LEVEL_LABELS[lvl]}
                </option>
              ))}
            </select>
            <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:17,pointerEvents:"none" }}>🎓</span>
            <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:12,pointerEvents:"none",color:"rgba(201,168,76,0.5)" }}>▼</span>
          </div>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="reg-phone" style={labelStyle}>📱 رقم الهاتف</label>
          <div style={{ position: "relative" }}>
            <input id="reg-phone" type="tel" autoComplete="tel"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx" style={inputStyle}
              onFocus={focusBorder} onBlur={blurBorder}
            />
            <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:17,pointerEvents:"none" }}>📱</span>
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="reg-password" style={labelStyle}>🔑 كلمة المرور</label>
          <div style={{ position: "relative" }}>
            <input id="reg-password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              style={{ ...inputStyle, paddingLeft: 52 }}
              onFocus={focusBorder} onBlur={blurBorder}
            />
            <span style={{ position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:17,pointerEvents:"none" }}>🔑</span>
            <button type="button" onClick={() => setShowPass((p) => !p)}
              style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",cursor:"pointer",
                color:"rgba(250,247,240,0.45)",fontSize:12,fontFamily:"Cairo,sans-serif",
                whiteSpace:"nowrap",
              }}
            >
              {showPass ? "إخفاء" : "إظهار"}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop:5, display:"flex", alignItems:"center", gap:6 }}>
              {[...Array(4)].map((_,i) => (
                <div key={i} style={{
                  flex:1, height:3, borderRadius:2, transition:"background 0.3s",
                  background: password.length > i*2
                    ? (password.length>=10 ? "#2D9E6B" : password.length>=6 ? "#C9A84C" : "#EF4444")
                    : "rgba(250,247,240,0.1)",
                }}/>
              ))}
              <span style={{ fontFamily:"Cairo,sans-serif",fontSize:10,color:"rgba(250,247,240,0.4)",whiteSpace:"nowrap" }}>
                {password.length<6 ? "ضعيفة" : password.length<10 ? "مقبولة" : "قوية"}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {localError && (
          <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
            className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background:"rgba(239,68,68,0.13)",border:"1px solid rgba(239,68,68,0.3)",
              color:"#FCA5A5",fontFamily:"Cairo,sans-serif" }}
          >
            ❌ {localError}
          </motion.div>
        )}

        {/* Submit */}
        <motion.button type="submit" disabled={isRegisterLoading}
          whileHover={!isRegisterLoading ? { y:-2 } : {}}
          whileTap={!isRegisterLoading ? { scale:0.98 } : {}}
          style={{
            width:"100%", padding:"15px", borderRadius:14, border:"none",
            background: isRegisterLoading ? "rgba(201,168,76,0.35)" : "linear-gradient(135deg,#C9A84C,#8B6914)",
            boxShadow: isRegisterLoading ? "none" : "0 6px 20px rgba(201,168,76,0.4)",
            color:"#1A1208", fontFamily:"Cairo,sans-serif",
            fontWeight:700, fontSize:16,
            cursor: isRegisterLoading ? "not-allowed" : "pointer",
            transition:"all 0.2s",
          }}
        >
          {isRegisterLoading ? "⏳ جارٍ إنشاء الحساب..." : "✨ إنشاء الحساب"}
        </motion.button>

        <p className="text-center mt-3"
          style={{ fontFamily:"Cairo,sans-serif",color:"rgba(250,247,240,0.3)",fontSize:11,lineHeight:1.6 }}>
          بالتسجيل تقبل شروط الاستخدام وسياسة الخصوصية
        </p>

        <p className="text-center mt-4"
          style={{ fontFamily:"Cairo,sans-serif",color:"rgba(250,247,240,0.5)",fontSize:13 }}>
          لديك حساب؟{" "}
          <Link href="/login" style={{ color:"#E8C97A",fontWeight:600,textDecoration:"none" }}>
            سجّل دخولك
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
