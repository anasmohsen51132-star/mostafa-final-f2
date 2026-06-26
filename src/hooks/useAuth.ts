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
  return res.json();
}

export function useAuth() {
  const { user, setAuth, clearAuth } = useAuthStore();
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
