// src/app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/bcrypt";
import { signToken, setAuthCookie } from "@/lib/auth";
import { normalizePhone, success, error } from "@/lib/utils";
import prisma from "@/lib/prisma";
import type { Role } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    }

    const { name, phone: rawPhone, password, academicLevel } = parsed.data;
    const phone = normalizePhone(rawPhone);

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return error("رقم الهاتف مسجل بالفعل", 409);

    const passwordHash = await hashPassword(password);

    // First user ever becomes OWNER
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    const role: Role = ownerCount === 0 ? "OWNER" : "STUDENT";

    const avatar = name.trim().charAt(0);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role,
        academicLevel: role === "STUDENT" ? academicLevel : null,
        avatar,
      },
      select: {
        id: true, name: true, phone: true, role: true,
        academicLevel: true, avatar: true, joinedAt: true, isActive: true,
      },
    });

    const token = await signToken({
      sub: user.id, phone: user.phone,
      role: user.role, name: user.name,
    });
    await setAuthCookie(token);

    return success({ user, token });
  } catch (e) {
    console.error("[register]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
