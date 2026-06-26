// src/app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/bcrypt";
import { signToken, setAuthCookie } from "@/lib/auth";
import { normalizePhone, success, error } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import type { Role } from "@/types";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = rateLimit(`register:${ip}`, 10, 10 * 60 * 1000);
    if (!limited.allowed) {
      return error("محاولات كثيرة جداً، حاول مرة أخرى بعد قليل", 429);
    }

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
    const avatar = name.trim().charAt(0);

    // SEC-003 FIX: the previous count() → create() pattern allowed two concurrent
    // registrations to both become OWNER. We now run the count + create inside a
    // single SERIALIZABLE transaction: Postgres will abort one of the two
    // concurrent transactions with a serialization error if they race, so only
    // one request can ever succeed in creating the first OWNER.
    let user;
    try {
      user = await prisma.$transaction(
        async (tx) => {
          const ownerCount = await tx.user.count({ where: { role: "OWNER" } });
          const role: Role = ownerCount === 0 ? "OWNER" : "STUDENT";

          return tx.user.create({
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (e: unknown) {
      // P2034 = Prisma's code for a serialization/write-conflict failure —
      // the other concurrent request won the race. Safe to retry once:
      // re-running will correctly see ownerCount >= 1 this time.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
        user = await prisma.$transaction(
          async (tx) => {
            const ownerCount = await tx.user.count({ where: { role: "OWNER" } });
            const role: Role = ownerCount === 0 ? "OWNER" : "STUDENT";
            return tx.user.create({
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
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );
      } else {
        throw e;
      }
    }

    const token = await signToken({
      sub: user.id, phone: user.phone,
      role: user.role, name: user.name,
    });
    await setAuthCookie(token);

    return success({ user });
  } catch (e) {
    console.error("[register]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
