// src/app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/bcrypt";
import { signToken, setAuthCookie, generateSessionId } from "@/lib/auth";
import { normalizePhone, success, error } from "@/lib/utils";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import type { Role, AcademicLevel } from "@/types";
import { Prisma } from "@prisma/client";

// DB-004 FIX: the retry-on-serialization-failure branch used to be a full
// copy-paste of the transaction body below. Any future schema/logic change
// applied to one copy and not the other would silently diverge. Extracted
// into a single function called from a small retry loop instead.
async function createUserAtomically(data: {
  name: string; phone: string; passwordHash: string; academicLevel: AcademicLevel;
}) {
  return prisma.$transaction(
    async (tx) => {
      const ownerCount = await tx.user.count({ where: { role: "OWNER" } });
      const role: Role = ownerCount === 0 ? "OWNER" : "STUDENT";

      return tx.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          passwordHash: data.passwordHash,
          role,
          academicLevel: role === "STUDENT" ? data.academicLevel : null,
          avatar: data.name.trim().charAt(0),
        },
        select: {
          id: true, name: true, phone: true, role: true,
          academicLevel: true, avatar: true, joinedAt: true, isActive: true,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // BUGFIX: same shared-IP lockout risk as login/route.ts — see the
    // detailed comment there. Raised threshold + skip when IP is unknown.
    if (ip !== "unknown") {
      const limited = await rateLimit(`register:${ip}`, 30, 10 * 60 * 1000);
      if (!limited.allowed) {
        return rateLimitResponse("محاولات كثيرة جداً، حاول مرة أخرى بعد قليل", limited.retryAfterMs);
      }
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

    // SEC-003 FIX: the previous count() → create() pattern allowed two concurrent
    // registrations to both become OWNER. We now run the count + create inside a
    // single SERIALIZABLE transaction: Postgres will abort one of the two
    // concurrent transactions with a serialization error if they race, so only
    // one request can ever succeed in creating the first OWNER.
    //
    // DB-004 FIX: one retry on a genuine serialization conflict (P2034) — the
    // losing request just re-reads ownerCount, which will correctly be >= 1
    // by then — via the single shared function above instead of a second
    // copy of the transaction body.
    let user;
    try {
      user = await createUserAtomically({ name, phone, passwordHash, academicLevel });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
        user = await createUserAtomically({ name, phone, passwordHash, academicLevel });
      } else {
        throw e;
      }
    }

    // AUTH-002: same single-device session id as login (see that route's comment).
    const sid = generateSessionId();
    await prisma.user.update({ where: { id: user.id }, data: { currentSessionId: sid } });

    const token = await signToken({
      sub: user.id, phone: user.phone,
      role: user.role, name: user.name, sid,
    });
    await setAuthCookie(token);

    return success({ user });
  } catch (e) {
    console.error("[register]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
