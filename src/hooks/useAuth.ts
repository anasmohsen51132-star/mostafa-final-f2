"use client";
// src/hooks/useAuth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";
import type { LoginForm, RegisterForm } from "@/types";

// ---- Generic fetch wrapper ----
// SEC-007/SEC-008 FIX: auth no longer relies on a Bearer token kept in JS-readable
// state. The httpOnly `auth_token` cookie is sent automatically by the browser on
// same-origin requests, so no Authorization header is needed here.
export async function fetchWithAuth(url: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(url, { ...options, headers, credentials: "same-origin" });

  // BUGFIX: this used to call res.json() unconditionally. If the server
  // ever returns a non-JSON body — a Vercel platform error page, a 504
  // gateway timeout, an uncaught exception that bypassed the route's own
  // try/catch — res.json() throws a SyntaxError, which every caller's
  // mutation onError handler then displays as the same generic, unhelpful
  // "حدث خطأ في الاتصال" regardless of what actually happened. We now parse
  // defensively and always resolve to a structured {success, error} object
  // carrying the real HTTP status, so the UI can show something specific
  // and the next time this happens it's actually diagnosable.
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    return {
      success: false,
      error: `خطأ غير متوقع من الخادم (HTTP ${res.status})`,
      status: res.status,
    };
  }

  if (parsed && typeof parsed === "object") return parsed;

  return {
    success: false,
    error: `استجابة غير صالحة من الخادم (HTTP ${res.status})`,
    status: res.status,
  };
}

export function useAuth() {
  const { user, isHydrated, isSessionVerified, setAuth, clearAuth } = useAuthStore();
  const toast = useToast();
  const router = useRouter();
  const qc = useQueryClient();

  // ---- Login ----
  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) =>
      fetchWithAuth("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (res) => {
      if (res.success) {
        setAuth(res.data.user);
        toast.success(`🎉 أهلاً بك، ${res.data.user.name.split(" ")[0]}!`);
        const role = res.data.user.role;
        if (role === "OWNER") router.push("/owner");
        else if (role === "ADMIN") router.push("/admin");
        else router.push("/dashboard");
      } else {
        toast.error(res.error || "خطأ في تسجيل الدخول");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  // ---- Register ----
  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      fetchWithAuth("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (res) => {
      if (res.success) {
        setAuth(res.data.user);
        toast.success("🎉 تم إنشاء حسابك بنجاح!");
        const role = res.data.user.role;
        if (role === "OWNER") router.push("/owner");
        else router.push("/dashboard");
      } else {
        toast.error(res.error || "خطأ في إنشاء الحساب");
      }
    },
    onError: () => toast.error("حدث خطأ في الاتصال"),
  });

  // ---- Logout ----
  const logout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" }).catch(() => null);
    clearAuth();
    qc.clear();
    toast.info("👋 تم تسجيل الخروج");
    router.push("/");
  };

  return {
    user,
    isHydrated,
    isSessionVerified,
    isAuthenticated: !!user,
    isOwner: user?.role === "OWNER",
    isAdmin: user?.role === "ADMIN" || user?.role === "OWNER",
    isStudent: user?.role === "STUDENT",
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.data?.error as string | undefined,
    registerError: registerMutation.data?.error as string | undefined,
    logout,
  };
}
