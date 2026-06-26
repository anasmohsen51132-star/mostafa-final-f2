// src/app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import { selfUpdateSchema, roleUpdateSchema, activeStatusUpdateSchema } from "@/lib/validations";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  // Can view own profile, or admin/owner can view any
  if (payload.sub !== id && payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, phone: true, role: true,
        avatar: true, joinedAt: true, isActive: true,
        redeemedCodes: {
          include: {
            courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
          },
        },
      },
    });
    if (!user) return notFound("المستخدم غير موجود");
    return success(user);
  } catch {
    return error("حدث خطأ", 500);
  }
}

// SEC-009 FIX: every field is now validated against a strict, role-specific
// zod schema instead of pulling arbitrary keys off the request body. Unknown
// fields are rejected outright (.strict()), closing the door on any future
// privilege-escalation field that gets added to the User model without an
// explicit allowlist update here.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    // Role changes: only owner can change roles, validated strictly
    if (body.role !== undefined) {
      if (payload.role !== "OWNER") return forbidden("فقط المالك يمكنه تغيير الأدوار");
      const parsed = roleUpdateSchema.safeParse({ role: body.role });
      if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
      if (payload.sub === id) return error("لا يمكنك تغيير صلاحيتك الخاصة");
      updateData.role = parsed.data.role;
    }

    // Activation: only admin or owner, validated strictly
    if (body.isActive !== undefined) {
      if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();
      const parsed = activeStatusUpdateSchema.safeParse({ isActive: body.isActive });
      if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
      updateData.isActive = parsed.data.isActive;
    }

    // Self profile edits (name/avatar): only the user themselves, validated strictly
    if (body.name !== undefined || body.avatar !== undefined) {
      if (payload.sub !== id) return forbidden();
      const parsed = selfUpdateSchema.safeParse({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
      });
      if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
      Object.assign(updateData, parsed.data);
    }

    if (Object.keys(updateData).length === 0) {
      return error("لا توجد بيانات صالحة للتحديث");
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, phone: true, role: true,
        avatar: true, joinedAt: true, isActive: true,
      },
    });
    return success(user);
  } catch (e) {
    console.error("[users PUT]", e);
    return error("فشل التحديث", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "OWNER") return forbidden();
  if (payload.sub === id) return error("لا يمكنك حذف حسابك");

  try {
    await prisma.user.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("فشل الحذف", 500);
  }
}
