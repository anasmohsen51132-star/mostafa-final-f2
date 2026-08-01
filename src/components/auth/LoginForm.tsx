"use client";
// src/components/auth/LoginForm.tsx

import { useState } from "react";
import { m as motion } from "framer-motion";
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

    if (!phone.trim()) {
      setLocalError("أدخل رقم الهاتف");
      return;
    }

    if (!password) {
      setLocalError("أدخل كلمة المرور");
      return;
    }

    login({ phone: phone.trim(), password });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 52,
    boxSizing: "border-box",
    padding: "14px 46px 14px 16px",
    borderRadius: 12,
    border: "1.5px solid rgba(201,168,76,0.25)",
    background: "rgba(250,247,240,0.06)",
    color: "#FAF7F0",
    fontFamily: "Cairo, sans-serif",
    // RESPONSIVE FIX: this used to be clamp(14px,3.8vw,15px) — always under
    // 16px on every device. iOS Safari (phone *and* tablet in portrait)
    // force-zooms the whole page in the instant an input under 16px gets
    // focus, then leaves it zoomed in — the exact "this page doesn't work
    // right on my phone" experience. 16px is the documented iOS threshold
    // that disables that auto-zoom, so the floor is raised to it here;
    // the field still scales up slightly on larger phones/tablets via vw.
    fontSize: "clamp(16px, 3.8vw, 17px)",
    outline: "none",
    direction: "rtl",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "Cairo, sans-serif",
    color: "rgba(250,247,240,0.75)",
    fontSize: "clamp(12px, 3.5vw, 13px)",
    marginBottom: 7,
    display: "block",
  };

  const focusInput = (element: HTMLInputElement) => {
    element.style.borderColor = "rgba(201,168,76,0.7)";
    element.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.1)";
  };

  const blurInput = (element: HTMLInputElement) => {
    element.style.borderColor = "rgba(201,168,76,0.25)";
    element.style.boxShadow = "none";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full"
      style={{
        width: "100%",
        maxWidth: 460,
        margin: "0 auto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        dir="rtl"
        style={{
          width: "100%",
          direction: "rtl",
        }}
      >
        {/* Phone field */}
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="phone" style={labelStyle}>
            📱 رقم الهاتف
          </label>

          <div style={{ position: "relative", width: "100%" }}>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              aria-invalid={Boolean(localError && !phone.trim())}
              style={inputStyle}
              onFocus={(e) => focusInput(e.target)}
              onBlur={(e) => blurInput(e.target)}
            />

            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                pointerEvents: "none",
              }}
            >
              📱
            </span>
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password" style={labelStyle}>
            🔑 كلمة المرور
          </label>

          <div style={{ position: "relative", width: "100%" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={Boolean(localError && !password)}
              style={{
                ...inputStyle,
                paddingRight: 46,
                paddingLeft: 62,
              }}
              onFocus={(e) => focusInput(e.target)}
              onBlur={(e) => blurInput(e.target)}
            />

            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                pointerEvents: "none",
              }}
            >
              🔑
            </span>

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: 48,
                minHeight: 36,
                padding: "4px 7px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: "rgba(250,247,240,0.65)",
                fontSize: "clamp(11px, 3vw, 13px)",
                fontFamily: "Cairo, sans-serif",
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
            animate={{
              opacity: 1,
              y: 0,
              x: [0, -6, 6, -4, 4, 0],
            }}
            transition={{ x: { duration: 0.4 } }}
            role="alert"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginBottom: 16,
              padding: "11px 14px",
              borderRadius: 12,
              textAlign: "center",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#FCA5A5",
              fontFamily: "Cairo, sans-serif",
              fontSize: "clamp(12px, 3.5vw, 14px)",
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
            minHeight: 54,
            boxSizing: "border-box",
            padding: "14px 16px",
            borderRadius: 14,
            background: isLoginLoading
              ? "rgba(201,168,76,0.4)"
              : "linear-gradient(135deg,#C9A84C,#8B6914)",
            boxShadow: isLoginLoading
              ? "none"
              : "0 6px 20px rgba(201,168,76,0.4)",
            color: "#1A1208",
            fontFamily: "Cairo, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 4vw, 16px)",
            border: "none",
            cursor: isLoginLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {isLoginLoading ? "⏳ جارٍ تسجيل الدخول..." : "🚀 دخول"}
        </motion.button>

        {/* Footer link */}
        <p
          className="text-center"
          style={{
            marginTop: 20,
            paddingInline: 8,
            fontFamily: "Cairo, sans-serif",
            color: "rgba(250,247,240,0.55)",
            fontSize: "clamp(12px, 3.5vw, 13px)",
            lineHeight: 1.8,
          }}
        >
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            style={{
              color: "#E8C97A",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            أنشئ حساباً الآن
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
