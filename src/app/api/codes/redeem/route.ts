// src/app/api/codes/redeem/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { redeemSchema } from "@/lib/validations";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "كود غير صحيح");

    const code = parsed.data.code.trim().toUpperCase();

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
      include: {
        courses: { include: { course: true } },
      },
    });

    if (!accessCode) return error("الكود غير صحيح أو غير موجود", 404);
    if (!accessCode.isActive) return error("هذا الكود غير نشط");
    if (accessCode.usedById) {
      if (accessCode.usedById === payload.sub) {
        return error("لقد استخدمت هذا الكود بالفعل");
      }
      return error("هذا الكود مستخدم بالفعل");
    }

    if (accessCode.expiresAt && new Date(accessCode.expiresAt) < new Date()) {
      return error("انتهت صلاحية هذا الكود");
    }

    // Mark as used
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { usedById: payload.sub, usedAt: new Date(), isActive: false },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courses = accessCode.courses.map((c: any) => c.course);
    return success({ courses, message: `تم تفعيل ${courses.length} كورس بنجاح! 🎉` });
  } catch (e) {
    console.error("[redeem]", e);
    return error("حدث خطأ في الاسترداد", 500);
  }
}
