// src/app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const body = await req.json();
  const { role, isActive, name, avatar } = body;

  // Role changes: only owner can change roles
  if (role !== undefined && payload.role !== "OWNER") return forbidden("فقط المالك يمكنه تغيير الأدوار");
  // Activation: only admin or owner
  if (isActive !== undefined && payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined && payload.sub === id) updateData.name = name;
    if (avatar !== undefined && payload.sub === id) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, phone: true, role: true,
        avatar: true, joinedAt: true, isActive: true,
      },
    });
    return success(user);
  } catch {
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
