// src/lib/validations.ts
import { z } from "zod";

const ACADEMIC_LEVELS = [
  "FIRST_SECONDARY",
  "SECOND_SECONDARY",
  "THIRD_SECONDARY",
] as const;

// ── Auth ──────────────────────────────────────────────────────

export const registerSchema = z.object({
  name:          z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(60),
  phone:         z.string().min(10, "رقم الهاتف غير صحيح").max(15)
                   .regex(/^[0-9+\-\s]+$/, "أرقام فقط"),
  password:      z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(100),
  academicLevel: z.enum(ACADEMIC_LEVELS, {
                   required_error:    "اختر المرحلة الدراسية",
                   invalid_type_error: "مرحلة دراسية غير صحيحة",
                 }),
});

export const loginSchema = z.object({
  phone:    z.string().min(1, "أدخل رقم الهاتف"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

// ── Courses ───────────────────────────────────────────────────

export const courseSchema = z.object({
  title:       z.string().min(3, "العنوان 3 أحرف على الأقل").max(120),
  description: z.string().max(1000).optional(),
  icon:        z.string().max(10).default("📚"),
  color:       z.string().max(20).regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, "صيغة اللون غير صحيحة").default("#1A6B47"),
  isPublished: z.boolean().default(false),
  levels:      z.array(z.enum(ACADEMIC_LEVELS)).default([]),
});

// ── Lectures ──────────────────────────────────────────────────

export const lectureSchema = z.object({
  title:            z.string().min(3).max(120),
  description:      z.string().max(1000).optional(),
  courseIds:        z.array(z.string()).min(1, "اختر كورساً واحداً على الأقل"),
  order:            z.number().int().default(0),
  quizRequirement:  z.enum(["NONE", "OPTIONAL", "MUST_PASS"]).optional(),
  quizPassScore:    z.number().int().min(1).max(100).optional(),
});

// ── Videos ────────────────────────────────────────────────────

export const videoSchema = z.object({
  title:      z.string().min(2).max(120),
  youtubeUrl: z.string().min(1, "أدخل رابط يوتيوب"),
  duration:   z.string().optional(),
  order:      z.number().int().default(0),
});

// ── Quiz / Homework ───────────────────────────────────────────
//
// FIX: imageUrl uses .transform to convert empty string → undefined
// This prevents the refine from receiving "" which is falsy but not
// semantically "no image provided". Now empty string is treated as absent.
//
// FIX: choice text also trimmed — prevents whitespace-only answers
// FIX: refine now correctly checks trimmed text vs defined imageUrl

const nonEmptyString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

export const choiceSchema = z.object({
  text:      nonEmptyString,
  imageUrl:  nonEmptyString,
  isCorrect: z.boolean(),
  order:     z.number().int().default(0),
}).refine(
  (c) => c.text !== undefined || c.imageUrl !== undefined,
  { message: "الخيار يجب أن يحتوي على نص أو صورة" }
);

export const questionSchema = z.object({
  text:     nonEmptyString,
  imageUrl: nonEmptyString,
  type:     z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]).default("MULTIPLE_CHOICE"),
  order:    z.number().int().default(0),
  choices:  z.array(choiceSchema).min(2, "خيارين على الأقل"),
}).refine(
  (q) => q.text !== undefined || q.imageUrl !== undefined,
  { message: "السؤال يجب أن يحتوي على نص أو صورة" }
).refine(
  (q) => q.choices.some((c) => c.isCorrect),
  { message: "يجب تحديد الإجابة الصحيحة" }
);

export const quizSchema = z.object({
  title:     z.string().min(3).max(120),
  timeLimit: z.number().int().positive().optional().nullable(),
  questions: z.array(questionSchema).min(1, "سؤال واحد على الأقل"),
});

export const homeworkSchema = z.object({
  title:     z.string().min(3).max(120),
  questions: z.array(
    // Homework questions don't need isCorrect validation
    z.object({
      text:     nonEmptyString,
      imageUrl: nonEmptyString,
      type:     z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]).default("MULTIPLE_CHOICE"),
      order:    z.number().int().default(0),
      choices:  z.array(z.object({
        text:      nonEmptyString,
        imageUrl:  nonEmptyString,
        isCorrect: z.boolean().default(false),
        order:     z.number().int().default(0),
      })).min(2),
    }).refine(
      (q) => q.text !== undefined || q.imageUrl !== undefined,
      { message: "السؤال يجب أن يحتوي على نص أو صورة" }
    )
  ).min(1),
});

// ── Access Codes ──────────────────────────────────────────────

export const codeGenerateSchema = z.object({
  courseIds: z.array(z.string()).min(1, "اختر كورساً واحداً على الأقل"),
  count:     z.number().int().min(1).max(500),
  expiresAt: z.string().optional().nullable(),
  note:      z.string().max(200).optional(),
});

export const redeemSchema = z.object({
  code: z.string().min(6, "الكود يجب أن يكون 6 أحرف على الأقل"),
});

// ── Site Settings ─────────────────────────────────────────────

const hexColor = z
  .string()
  .max(20)
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, "صيغة اللون غير صحيحة (يجب أن تكون hex مثل #1A6B47)");

export const siteSettingsSchema = z
  .object({
    heroTitle:        z.string().max(100).optional(),
    heroSubtitle:     z.string().max(150).optional(),
    heroDesc:         z.string().max(500).optional(),
    teacherName:      z.string().max(80).optional(),
    teacherTitle:     z.string().max(120).optional(),
    teacherBio:       z.string().max(800).optional(),
    platformName:     z.string().max(80).optional(),
    platformTagline:  z.string().max(120).optional(),
    primaryColor:     hexColor.optional(),
    accentColor:      hexColor.optional(),
    dashboardWelcome: z.string().max(200).optional(),
    dashboardBanner:  z.string().url("رابط الصورة غير صحيح").max(500).optional().nullable(),
    footerText:       z.string().max(200).optional(),
  })
  .strict();

// ── Users (strict whitelist for profile/role updates) ──────────

export const selfUpdateSchema = z.object({
  name:   z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(60).optional(),
  avatar: z.string().max(10).optional(),
}).strict();

export const roleUpdateSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "STUDENT"]),
}).strict();

export const activeStatusUpdateSchema = z.object({
  isActive: z.boolean(),
}).strict();

// ── Inferred types ────────────────────────────────────────────

export type RegisterInput     = z.infer<typeof registerSchema>;
export type LoginInput        = z.infer<typeof loginSchema>;
export type CourseInput       = z.infer<typeof courseSchema>;
export type LectureInput      = z.infer<typeof lectureSchema>;
export type VideoInput        = z.infer<typeof videoSchema>;
export type QuizInput         = z.infer<typeof quizSchema>;
export type HomeworkInput     = z.infer<typeof homeworkSchema>;
export type CodeGenerateInput = z.infer<typeof codeGenerateSchema>;
