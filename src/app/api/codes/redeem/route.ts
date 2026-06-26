// src/app/api/codes/redeem/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { redeemSchema } from "@/lib/validations";
import { success, error, unauthorized } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  // Throttle code-guessing attempts per logged-in user
  const limited = rateLimit(`redeem:${payload.sub}`, 20, 5 * 60 * 1000);
  if (!limited.allowed) {
    return error("محاولات كثيرة جداً، حاول مرة أخرى بعد قليل", 429);
  }

  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "كود غير صحيح");

    const code = parsed.data.code.trim().toUpperCase();

    // ── Step 1: Read-only check (fast, no lock) ──────────────────
    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
      include: {
        courses: { include: { course: true } },
      },
    });

    if (!accessCode) return error("الكود غير صحيح أو غير موجود", 404);

    // Already used by THIS user → friendly message
    if (accessCode.usedById === payload.sub) {
      return error("لقد استخدمت هذا الكود بالفعل");
    }

    // ── Step 2: Atomic claim — only one request wins ──────────────
    // updateMany returns { count: 0 } if the WHERE conditions no longer
    // match (another request already claimed it between step 1 and here).
    const claimed = await prisma.accessCode.updateMany({
      where: {
        code,
        usedById: null,   // ← guard: only unclaimed codes
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      data: {
        usedById: payload.sub,
        usedAt:   new Date(),
        isActive: false,
      },
    });

    // count === 0 means the race was lost (or code was inactive/expired)
    if (claimed.count === 0) {
      // Re-fetch to give the user the right error message
      const latest = await prisma.accessCode.findUnique({ where: { code } });

      if (!latest)            return error("الكود غير صحيح أو غير موجود", 404);
      if (!latest.isActive)   return error("هذا الكود غير نشط");
      if (latest.usedById)    return error("هذا الكود مستخدم بالفعل");
      if (latest.expiresAt && new Date(latest.expiresAt) < new Date())
                              return error("انتهت صلاحية هذا الكود");

      return error("تعذر تفعيل الكود، حاول مرة أخرى", 409);
    }

    // ── Step 3: Return the unlocked courses ───────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courses = accessCode.courses.map((c: any) => c.course);
    return success({ courses, message: `تم تفعيل ${courses.length} كورس بنجاح! 🎉` });

  } catch (e) {
    console.error("[redeem]", e);
    return error("حدث خطأ في الاسترداد", 500);
  }
}
