// src/components/developer/developerModules.ts
//
// Single source of truth for every Developer Dashboard module.
// Used by:
//   - (developer)/layout.tsx        → builds the sidebar
//   - (developer)/developer/page.tsx → builds the "Coming Soon" card grid
//   - each developer/<module>/page.tsx → renders its own ComingSoonModule
//
// Keeping this list in one place means adding/renaming a module never
// requires touching the sidebar and the dashboard home separately.

export interface DeveloperModule {
  id: string;
  label: string;
  icon: string;
  href: string;
  description: string;
  // Task 3: true once a module has a real page behind it (monitoring/
  // errors from Task 2; performance/database/security from Task 3).
  // The sidebar in (developer)/layout.tsx still lists every module
  // regardless of this flag — a developer can navigate to any of them —
  // this only controls whether the dashboard home's "قريباً" grid still
  // shows a "coming soon" card for it.
  isLive?: boolean;
}

export const DEVELOPER_MODULES: DeveloperModule[] = [
  {
    id: "ai-guardian",
    label: "الحارس الذكي (AI Guardian)",
    icon: "🛡️",
    href: "/developer/ai-guardian",
    description: "تحليل ذكي (بموافقة بشرية صريحة) لصحة المنصة: رؤى، تنبؤات، وتحليل جذري للحوادث.",
    isLive: true,
  },
  {
    id: "monitoring",
    label: "أحداث النظام",
    icon: "📡",
    href: "/developer/monitoring",
    description: "سجل زمني لأحداث المنصة: تسجيل دخول، أحداث أمان، وأحداث النظام.",
    isLive: true,
  },
  {
    id: "errors",
    label: "مركز الأخطاء",
    icon: "🐞",
    href: "/developer/errors",
    description: "بحث وفلترة وتتبع الأخطاء المسجلة عبر المنصة.",
    isLive: true,
  },
  {
    id: "performance",
    label: "الأداء",
    icon: "⚡",
    href: "/developer/performance",
    description: "قياس سرعة الاستجابة ومؤشرات الأداء العامة.",
    isLive: true,
  },
  {
    id: "security",
    label: "مركز الأمان",
    icon: "🔒",
    href: "/developer/security",
    description: "فحوصات أمنية ومراجعة محاولات الوصول غير المصرح بها.",
    isLive: true,
  },
  {
    id: "database",
    label: "قاعدة البيانات",
    icon: "🗄️",
    href: "/developer/database",
    description: "نظرة عامة على صحة واستخدام قاعدة البيانات.",
    isLive: true,
  },
  {
    id: "incidents",
    label: "مركز الحوادث",
    icon: "🧩",
    href: "/developer/incidents",
    description: "تتبع الحوادث المتكررة، تحليل السبب الجذري بالذكاء الاصطناعي، وسير عمل الحل.",
    isLive: true,
  },
  {
    id: "deployments",
    label: "عمليات النشر",
    icon: "🚀",
    href: "/developer/deployments",
    description: "متابعة تاريخ عمليات النشر وحالتها.",
    isLive: true,
  },
  {
    id: "backup",
    label: "النسخ الاحتياطي",
    icon: "💾",
    href: "/developer/backup",
    description: "حالة قاعدة البيانات وجاهزية الاستعادة.",
    isLive: true,
  },
  {
    id: "notifications",
    label: "الإشعارات",
    icon: "🔔",
    href: "/developer/notifications",
    description: "مركز تنبيهات النظام الموجهة للمطور فقط.",
  },
  {
    id: "reports",
    label: "التقارير",
    icon: "📈",
    href: "/developer/reports",
    description: "تقارير دورية عن صحة وأداء المنصة.",
  },
  {
    id: "settings",
    label: "الإعدادات",
    icon: "⚙️",
    href: "/developer/settings",
    description: "فحص إعدادات المنصة، وتفضيلات لوحة المطور.",
    isLive: true,
  },
];
