// ============================================================
// MUSTAFA ACADEMY — Global TypeScript Types v3
// ============================================================

export type Role = "OWNER" | "ADMIN" | "STUDENT";

export type AcademicLevel =
  | "FIRST_SECONDARY"
  | "SECOND_SECONDARY"
  | "THIRD_SECONDARY";

export type QuizRequirement = "NONE" | "OPTIONAL" | "MUST_PASS";

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  FIRST_SECONDARY:  "الأول الثانوي",
  SECOND_SECONDARY: "الثاني الثانوي",
  THIRD_SECONDARY:  "الثالث الثانوي",
};

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  "FIRST_SECONDARY",
  "SECOND_SECONDARY",
  "THIRD_SECONDARY",
];

export const QUIZ_REQUIREMENT_LABELS: Record<QuizRequirement, string> = {
  NONE:      "بدون اختبار — الدرس مفتوح دائماً",
  OPTIONAL:  "اختبار اختياري — الدرس مفتوح دون اجتياز",
  MUST_PASS: "اختبار إجباري — يجب الاجتياز لفتح الدرس",
};

// ── USERS ───────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  academicLevel?: AcademicLevel | null;
  avatar?: string | null;
  joinedAt: string;
  isActive: boolean;
}

export interface AuthResponse { user: User; token: string; }

// ── COURSES ─────────────────────────────────────────────────

export interface CourseLevel { courseId: string; academicLevel: AcademicLevel; }

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  icon: string;
  color: string;
  isPublished: boolean;
  createdAt: string;
  levels?: CourseLevel[];
  _count?: { lectures: number };
}

export interface CourseWithLectures extends Course { lectures: CourseLecture[]; }

// ── LECTURES ────────────────────────────────────────────────

export interface Lecture {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  quizRequirement: QuizRequirement;
  quizPassScore: number;
  createdAt: string;
  courses?: { course: { id: string; title: string; icon: string } }[];
  videos?: Video[];
  pdfs?: PDF[];
  quizzes?: Quiz[];
  homework?: Homework[];
  _count?: { videos: number; pdfs: number; quizzes: number; homework: number };
}

export interface CourseLecture {
  id: string; lectureId: string; courseId: string; order: number; lecture: Lecture;
}

// ── VIDEOS ──────────────────────────────────────────────────

export interface Video {
  id: string; lectureId: string; title: string;
  youtubeId: string; order: number; duration?: string | null; createdAt: string;
}

// ── PDFs ────────────────────────────────────────────────────

export interface PDF {
  id: string; lectureId: string; title: string;
  fileUrl: string; order: number; createdAt: string;
}

// ── QUIZZES ─────────────────────────────────────────────────

export interface Quiz {
  id: string; lectureId: string; title: string;
  timeLimit?: number | null; questions: Question[];
  _count?: { questions: number };
  // student's own submissions for this quiz
  mySubmissions?: QuizAttempt[];
}

export interface Question {
  id: string; quizId?: string | null; homeworkId?: string | null;
  text?: string | null; imageUrl?: string | null;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE"; order: number; choices: Choice[];
}

export interface Choice {
  id: string; questionId: string; text?: string | null;
  imageUrl?: string | null; isCorrect: boolean; order: number;
}

// ── HOMEWORK ────────────────────────────────────────────────

export interface Homework {
  id: string; lectureId: string; title: string; questions: Question[];
  _count?: { questions: number };
  mySubmissions?: HomeworkAttempt[];
}

// ── QUIZ ATTEMPT (multi-attempt submission) ──────────────────

export interface QuizAttempt {
  id: string; userId: string; quizId: string;
  attemptNumber: number; score: number; total: number;
  percentage: number; passed: boolean; submittedAt: string;
  answers: Record<string, string>;
  // enriched
  user?: Pick<User, "id" | "name" | "phone">;
  quiz?: Pick<Quiz, "id" | "title"> & { lecture?: Pick<Lecture, "id" | "title"> };
}

// ── HOMEWORK ATTEMPT ─────────────────────────────────────────

export interface HomeworkAttempt {
  id: string; userId: string; homeworkId: string;
  attemptNumber: number; answers: Record<string, string>;
  grade?: number | null; feedback?: string | null;
  submittedAt: string; gradedAt?: string | null;
  user?: Pick<User, "id" | "name" | "phone">;
  homework?: Pick<Homework, "id" | "title"> & { lecture?: Pick<Lecture, "id" | "title"> };
}

// ── ACCESS CODES ────────────────────────────────────────────

export interface CourseOnCode { codeId: string; courseId: string; course: Course; }

export interface AccessCode {
  id: string; code: string; courses?: CourseOnCode[];
  expiresAt?: string | null; usedBy?: User | null; usedAt?: string | null;
  createdById?: string; createdAt: string; isActive: boolean; note?: string | null;
}

// ── PROGRESS ────────────────────────────────────────────────

export interface Progress {
  id: string; userId: string; lectureId: string; videoId?: string | null;
  completed: boolean; watchedAt?: string | null;
}

// ── SITE SETTINGS ───────────────────────────────────────────

export interface SiteSettings {
  id: string; heroTitle: string; heroSubtitle: string; heroDesc: string;
  teacherName: string; teacherTitle: string; teacherBio: string;
  teacherStats: { value: string; label: string }[];
  features: { icon: string; title: string; desc: string }[];
  primaryColor: string; accentColor: string; platformName: string;
  platformTagline: string; loginBgGradient: string;
  dashboardBanner?: string | null; dashboardWelcome: string; footerText: string;
  statsBar: { value: string; label: string }[];
}

// ── API RESPONSES ───────────────────────────────────────────

export interface ApiSuccess<T> { success: true; data: T; }
export interface ApiError      { success: false; error: string; code?: string; }
export type ApiResponse<T>     = ApiSuccess<T> | ApiError;

// ── FORMS ───────────────────────────────────────────────────

export interface LoginForm    { phone: string; password: string; }
export interface RegisterForm { name: string; phone: string; password: string; academicLevel: AcademicLevel; }

export interface CourseForm {
  title: string; description: string; icon: string;
  color: string; isPublished: boolean; levels: AcademicLevel[];
}

export interface LectureForm {
  title: string; description: string; courseIds: string[];
  quizRequirement?: QuizRequirement; quizPassScore?: number;
}

export interface VideoForm    { title: string; youtubeUrl: string; duration?: string; }

export interface QuestionForm {
  text?: string; imageUrl?: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  choices: ChoiceForm[];
}

export interface ChoiceForm { text?: string; imageUrl?: string; isCorrect: boolean; }

export interface QuizForm {
  title: string; timeLimit?: number; questions: QuestionForm[];
}

export interface CodeGenerateForm {
  courseIds: string[]; count: number; expiresAt?: string; note?: string;
}

// ── QUIZ RESULT (from submit response) ──────────────────────

export interface QuizResult {
  score: number; total: number; percentage: number; passed: boolean;
  attemptNumber: number; attemptsRemaining: number;
  details: {
    questionId: string; correct: boolean;
    selectedChoiceId: string; correctChoiceId: string;
  }[];
}

// ── PLATFORM STATS ──────────────────────────────────────────

export interface PlatformStats {
  totalStudents: number; totalCourses: number; totalLectures: number;
  totalCodes: number; codesUsed: number; codesAvailable: number;
}

// ── RESULTS DASHBOARD ───────────────────────────────────────

export interface StudentResultRow {
  studentId: string; studentName: string; studentPhone: string;
  courseTitle: string; lectureTitle: string;
  quizTitle?: string; attemptNumber: number;
  score?: number; total?: number; percentage?: number; passed?: boolean;
  submittedAt: string;
  type: "quiz" | "homework";
  homeworkTitle?: string; grade?: number;
}
