"use client";
// src/components/auth/LoginForm.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { login, isLoginLoading } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!phone.trim()) { setLocalError("أدخل رقم الهاتف"); return; }
    if (!password)      { setLocalError("أدخل كلمة المرور"); return; }
    login({ phone: phone.trim(), password });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 46px 14px 16px",
    borderRadius: 12,
    border: "1.5px solid rgba(201,168,76,0.25)",
    background: "rgba(250,247,240,0.06)",
    color: "#FAF7F0",
    fontFamily: "Cairo,sans-serif",
    fontSize: 15,
    outline: "none",
    direction: "rtl",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "Cairo,sans-serif",
    color: "rgba(250,247,240,0.7)",
    fontSize: 13,
    marginBottom: 6,
    display: "block",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit} noValidate style={{ direction: "rtl" }}>
        {/* Phone field */}
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="phone" style={labelStyle}>📱 رقم الهاتف</label>
          <div style={{ position: "relative" }}>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              style={{ ...inputStyle, paddingRight: 46 }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
            />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>
              📱
            </span>
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password" style={labelStyle}>🔑 كلمة المرور</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 46, paddingLeft: 46 }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
            />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>
              🔑
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(250,247,240,0.5)", fontSize: 14, fontFamily: "Cairo,sans-serif",
              }}
            >
              {showPassword ? "إخفاء" : "إظهار"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {localError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
            transition={{ x: { duration: 0.4 } }}
            className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#FCA5A5",
              fontFamily: "Cairo,sans-serif",
            }}
          >
            ❌ {localError}
          </motion.div>
        )}

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoginLoading}
          whileHover={!isLoginLoading ? { y: -2 } : {}}
          whileTap={!isLoginLoading ? { scale: 0.98 } : {}}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 14,
            background: isLoginLoading
              ? "rgba(201,168,76,0.4)"
              : "linear-gradient(135deg,#C9A84C,#8B6914)",
            boxShadow: isLoginLoading ? "none" : "0 6px 20px rgba(201,168,76,0.4)",
            color: "#1A1208",
            fontFamily: "Cairo,sans-serif",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            cursor: isLoginLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!isLoginLoading && (
            <motion.span
              aria-hidden
              style={{
                position: "absolute",
                top: 0, left: "-60%",
                width: "50%", height: "100%",
                background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)",
                transform: "skewX(-20deg)",
              }}
              animate={{ left: ["-60%", "130%"] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>
            {isLoginLoading ? "⏳ جارٍ تسجيل الدخول..." : "🚀 دخول"}
          </span>
        </motion.button>

        {/* Footer link */}
        <p
          className="text-center mt-5"
          style={{ fontFamily: "Cairo,sans-serif", color: "rgba(250,247,240,0.5)", fontSize: 13 }}
        >
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            style={{ color: "#E8C97A", fontWeight: 600, textDecoration: "none" }}
          >
            أنشئ حساباً الآن
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
