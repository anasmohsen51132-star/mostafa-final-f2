// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyPassword, DUMMY_HASH } from "@/lib/bcrypt";
import { signToken, setAuthCookie } from "@/lib/auth";
import { normalizePhone, success, error } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // 10 attempts / 5 minutes per IP, regardless of phone — blunts brute force & stuffing
    const limited = rateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
    if (!limited.allowed) {
      return error("محاولات كثيرة جداً، حاول مرة أخرى بعد قليل", 429);
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    }

    const phone = normalizePhone(parsed.data.phone);
    const { password } = parsed.data;

    // Per-account limit too, to blunt distributed credential stuffing across many IPs
    const accountLimited = rateLimit(`login-account:${phone}`, 10, 5 * 60 * 1000);
    if (!accountLimited.allowed) {
      return error("محاولات كثيرة جداً على هذا الحساب، حاول مرة أخرى بعد قليل", 429);
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

    const token = await signToken({ sub: user.id, phone: user.phone, role: user.role, name: user.name });
    await setAuthCookie(token);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return success({ user: safeUser });
  } catch (e) {
    console.error("[login]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
