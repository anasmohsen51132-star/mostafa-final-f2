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
}

export const DEVELOPER_MODULES: DeveloperModule[] = [
  {
    id: "ai-guardian",
    label: "الحارس الذكي (AI Guardian)",
    icon: "🛡️",
    href: "/developer/ai-guardian",
    description: "مراقبة ذكية تلقائية لصحة المنصة والتنبيه المبكر عن أي مشاكل.",
  },
  {
    id: "monitoring",
    label: "أحداث النظام",
    icon: "📡",
    href: "/developer/monitoring",
    description: "سجل زمني لأحداث المنصة: تسجيل دخول، أحداث أمان، وأحداث النظام.",
  },
  {
    id: "errors",
    label: "مركز الأخطاء",
    icon: "🐞",
    href: "/developer/errors",
    description: "بحث وفلترة وتتبع الأخطاء المسجلة عبر المنصة.",
  },
  {
    id: "performance",
    label: "الأداء",
    icon: "⚡",
    href: "/developer/performance",
    description: "قياس سرعة الاستجابة ومؤشرات الأداء العامة.",
  },
  {
    id: "security",
    label: "مركز الأمان",
    icon: "🔒",
    href: "/developer/security",
    description: "فحوصات أمنية ومراجعة محاولات الوصول غير المصرح بها.",
  },
  {
    id: "database",
    label: "قاعدة البيانات",
    icon: "🗄️",
    href: "/developer/database",
    description: "نظرة عامة على صحة واستخدام قاعدة البيانات.",
  },
  {
    id: "deployments",
    label: "عمليات النشر",
    icon: "🚀",
    href: "/developer/deployments",
    description: "متابعة تاريخ عمليات النشر وحالتها.",
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
    description: "إعدادات لوحة المطور المتقدمة.",
  },
];
