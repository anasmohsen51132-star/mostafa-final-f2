// src/lib/access.ts
// Centralized ownership verification: AccessCode → CourseOnCode → CourseLecture
// Used by every student-facing endpoint that reads or writes lecture-scoped content.
import prisma from "@/lib/prisma";

/**
 * Returns true if the user has ADMIN/OWNER role (full access) or has redeemed
 * an AccessCode that unlocks a course containing the given lecture.
 */
export async function userOwnsLecture(userId: string, role: string, lectureId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER") return true;

  const owned = await prisma.courseLecture.findFirst({
    where: {
      lectureId,
      course: {
        codes: {
          some: {
            code: { usedById: userId },
          },
        },
      },
    },
    select: { id: true },
  });

  return !!owned;
}

/** Same check, but starting from a quizId (resolves lectureId first). */
export async function userOwnsQuiz(userId: string, role: string, quizId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER") return true;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { lectureId: true } });
  if (!quiz) return false;
  return userOwnsLecture(userId, role, quiz.lectureId);
}

/** Same check, but starting from a homeworkId (resolves lectureId first). */
export async function userOwnsHomework(userId: string, role: string, homeworkId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER") return true;
  const hw = await prisma.homework.findUnique({ where: { id: homeworkId }, select: { lectureId: true } });
  if (!hw) return false;
  return userOwnsLecture(userId, role, hw.lectureId);
}
