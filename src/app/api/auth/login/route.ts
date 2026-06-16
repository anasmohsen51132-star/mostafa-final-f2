// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations";
import { verifyPassword } from "@/lib/bcrypt";
import { signToken, setAuthCookie } from "@/lib/auth";
import { normalizePhone, success, error } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    }

    const phone = normalizePhone(parsed.data.phone);
    const { password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true, name: true, phone: true, role: true,
        avatar: true, joinedAt: true, isActive: true, passwordHash: true,
      },
    });

    if (!user) return error("رقم الهاتف أو كلمة المرور غير صحيحة", 401);
    if (!user.isActive) return error("حسابك موقوف، تواصل مع الإدارة", 403);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return error("رقم الهاتف أو كلمة المرور غير صحيحة", 401);

    const token = await signToken({ sub: user.id, phone: user.phone, role: user.role, name: user.name });
    await setAuthCookie(token);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return success({ user: safeUser, token });
  } catch (e) {
    console.error("[login]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
