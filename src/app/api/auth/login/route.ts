// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyPassword, DUMMY_HASH } from "@/lib/bcrypt";
import { signToken, setAuthCookie, generateSessionId } from "@/lib/auth";
import { normalizePhone, success, error } from "@/lib/utils";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // BUGFIX: 10 attempts/5min was too tight for a shared IP — many
    // students on the same school/home Wi-Fi, or even unrelated users
    // sharing a carrier's IP (very common with Egyptian mobile networks'
    // CGNAT), all land in the same bucket. A handful of real, unrelated
    // wrong-password attempts from different people on that IP could
    // exhaust it and lock out everyone else on that network — exactly the
    // "كل الاكونتات وكل الاجهزة ممنوعة" symptom. Raised generously (40) so
    // that only genuine high-volume abuse from one IP trips it; the
    // per-account limit below (unaffected by shared IPs, since it's keyed
    // on the phone number being logged into) remains the real defense
    // against someone brute-forcing one specific account.
    //
    // Also: if we can't identify the caller's IP at all, `ip` is "unknown"
    // — applying a shared limit to that bucket would lump together every
    // caller we failed to identify and risk blocking all of them at once
    // for no real security benefit (the account-level limit already
    // protects each account regardless). Skip IP limiting entirely in
    // that case rather than risk a mass lockout.
    if (ip !== "unknown") {
      const limited = await rateLimit(`login:${ip}`, 40, 5 * 60 * 1000);
      if (!limited.allowed) {
        return rateLimitResponse("محاولات كثيرة جداً، حاول مرة أخرى بعد قليل", limited.retryAfterMs);
      }
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    }

    const phone = normalizePhone(parsed.data.phone);
    const { password } = parsed.data;

    // Per-account limit too, to blunt distributed credential stuffing across many IPs
    const accountLimited = await rateLimit(`login-account:${phone}`, 10, 5 * 60 * 1000);
    if (!accountLimited.allowed) {
      return rateLimitResponse("محاولات كثيرة جداً على هذا الحساب، حاول مرة أخرى بعد قليل", accountLimited.retryAfterMs);
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true, name: true, phone: true, role: true,
        avatar: true, joinedAt: true, isActive: true, passwordHash: true,
      },
    });

    // SEC-008 FIX: previously we returned immediately when the phone wasn't
    // found, skipping the ~100-200ms bcrypt comparison that runs on the
    // "wrong password" path — the timing difference let an attacker
    // enumerate which phone numbers are registered. We now always run a
    // bcrypt comparison (against the real hash, or a dummy one of the same
    // cost if no user exists) before returning the identical rejection.
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !valid) return error("رقم الهاتف أو كلمة المرور غير صحيحة", 401);
    if (!user.isActive) return error("حسابك موقوف، تواصل مع الإدارة", 403);

    // AUTH-002: a fresh session id here, saved as the *only* valid one for
    // this account, is what makes login on this device immediately log out
    // any other device — their token still has a valid signature, but its
    // embedded sid no longer matches what's in the DB (checked in /api/auth/me).
    const sid = generateSessionId();
    await prisma.user.update({ where: { id: user.id }, data: { currentSessionId: sid } });

    const token = await signToken({ sub: user.id, phone: user.phone, role: user.role, name: user.name, sid });
    await setAuthCookie(token);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return success({ user: safeUser });
  } catch (e) {
    console.error("[login]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
