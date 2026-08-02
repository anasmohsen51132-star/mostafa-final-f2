"use client";
// src/components/onboarding/WelcomeTour.tsx
// First-run guided tour for students — Academy edition (gold/emerald identity).
//
// Shows once per student (flag kept in localStorage, keyed by user id) the
// first time they land inside the student area. Walks them through every
// student page — لوحة التحكم، الكورسات، كود الاشتراك، كورساتي، الملف الشخصي —
// driven entirely by the "التالي" button: each step spotlights the matching
// sidebar item and navigates the real app to that page in the background,
// so what the student sees behind the tour card is the actual page being
// described.
//
// SPOTLIGHT FIX: the previous version drew a single full-screen dim/blur
// layer and placed a glowing ring "on top" of it — but the ring was purely
// decorative, the dim layer underneath still covered the real sidebar item,
// so the icon + page name inside the "highlighted" box were invisible. This
// version instead builds the dim layer out of four separate panels framing
// a hole around the target element, so that exact rectangle is left
// completely untouched (no tint, no blur) and the real sidebar label reads
// through it, exactly like the ring around it implies.
//
// Persistence is intentionally client-only (localStorage) — no schema
// change needed. If a DB-backed "onboarding completed" flag is ever wanted
// (e.g. to survive a cleared browser / follow the student across devices),
// this is the single place to swap the read/write for an API call.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";
import { springBouncy } from "@/lib/motion-presets";

interface TourStep {
  id: string;
  route?: string;
  targetId?: string; // matches data-tour-id on the sidebar item
  icon: string;
  title: string;
  description: string;
  bullets?: string[];
  cta?: string; // custom label for the "next" button on this step
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: "﷽",
    title: "أهلاً بيك في أكاديمية مستر مصطفى",
    description:
      "هناخدك في جولة سريعة على المنصة عشان تتعرف على كل صفحة وإزاي تستخدمها كطالب. تقدر تتخطى الجولة في أي وقت.",
    cta: "ابدأ الجولة",
  },
  {
    id: "dashboard",
    route: "/dashboard",
    targetId: "dashboard",
    icon: "🏠",
    title: "لوحة التحكم",
    description:
      "دي صفحتك الرئيسية. هتلاقي فيها نظرة عامة على تقدمك، آخر محاضرة كنت بتذاكر فيها عشان تكمل منها على طول، وإحصائيات بسيطة عن نشاطك.",
  },
  {
    id: "courses",
    route: "/courses",
    targetId: "courses",
    icon: "📚",
    title: "الكورسات",
    description:
      "هنا بتلاقي كل الكورسات المتاحة على المنصة، تقدر تتصفحها وتشوف تفاصيلها حتى لو لسه مش مشترك فيها، عشان تعرف تختار الكورس المناسب لصفك الدراسي.",
  },
  {
    id: "redeem",
    route: "/redeem",
    targetId: "redeem",
    icon: "🎟️",
    title: "استخدام كود الاشتراك",
    description:
      "دي أهم صفحة عشان تفتح الكورسات. الكود بتاخده من المستر مباشرةً (كارت أو ورقة فيها كود)، وبتكتبه هنا لفتح الكورس المرتبط بيه.",
    bullets: [
      "اكتب الكود في الخانة زي ما هو مكتوب بالظبط",
      "اضغط \"تفعيل\" وسيبه يتحقق منه",
      "الكورس هيتفتح فورًا ويظهر في \"كورساتي\"",
    ],
  },
  {
    id: "my-courses",
    route: "/my-courses",
    targetId: "my-courses",
    icon: "🎓",
    title: "كورساتي",
    description:
      "دي الكورسات اللي انت مشترك فيها فعليًا بعد ما فعّلت الكود. من هنا بتدخل على المحاضرات، تكمل من حيث ما وقفت، وتحل الواجبات والاختبارات.",
  },
  {
    id: "profile",
    route: "/profile",
    targetId: "profile",
    icon: "👤",
    title: "الملف الشخصي",
    description:
      "هنا بياناتك الشخصية: اسمك، رقم الهاتف اللي بتسجل بيه دخولك، وصفك الدراسي. تقدر تراجعها في أي وقت.",
  },
  {
    id: "permissions",
    route: "/dashboard",
    icon: "🔐",
    title: "صلاحياتك كطالب",
    description: "عشان تكون الصورة واضحة، ده اللي تقدر تعمله على المنصة:",
    bullets: [
      "تصفح كل الكورسات ومشاهدة المحاضرات في الكورسات اللي فتحتها بس",
      "تفعيل كود اشتراك عشان تفتح كورس جديد",
      "حل الواجبات والاختبارات ومتابعة نتائجك",
      "تعديل بياناتك الشخصية من صفحة الملف الشخصي",
    ],
  },
  {
    id: "finish",
    icon: "✨",
    title: "جاهز تبدأ!",
    description:
      "كده عرفت تتحرك في المنصة براحتك. لو محتاج تراجع أي حاجة، الصفحات كلها موجودة دايمًا في القائمة الجانبية. بالتوفيق في رحلتك مع اللغة العربية!",
    cta: "ابدأ رحلتي",
  },
];

const STORAGE_PREFIX = "mustafa_onboarding_done_";
const SPOTLIGHT_PADDING = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  userId: string;
}

export function WelcomeTour({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const checkedRef = useRef(false);

  // Decide, once, whether this student needs the tour.
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      const done = localStorage.getItem(STORAGE_PREFIX + userId);
      if (!done) {
        // Small delay so the tour doesn't collide with the name-splash
        // welcome animation that already plays on first dashboard visit.
        const t = setTimeout(() => setActive(true), 3200);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable (e.g. private mode edge cases) — skip tour
      // rather than risk showing it on every single visit.
    }
  }, [userId]);

  const step = STEPS[stepIndex];

  const updateRect = useCallback(() => {
    if (typeof window === "undefined") return;
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    if (!step?.targetId || window.innerWidth < 1024) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!active) return;
    if (step.route && pathname !== step.route) {
      router.push(step.route);
      return; // rect will be recomputed once pathname updates
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    const raf = requestAnimationFrame(updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
      cancelAnimationFrame(raf);
    };
  }, [active, step, pathname, router, updateRect]);

  const finish = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(STORAGE_PREFIX + userId, "1");
    } catch {
      /* non-fatal */
    }
  }, [userId]);

  const goNext = () => {
    if (stepIndex >= STEPS.length - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  if (!active) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  // Geometry for the four-panel "hole" cutout — see file header for why
  // this replaced the old flat backdrop + decorative ring approach.
  const hole = rect
    ? {
        top: Math.max(0, rect.top - SPOTLIGHT_PADDING),
        left: Math.max(0, rect.left - SPOTLIGHT_PADDING),
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  const dimPanelStyle: React.CSSProperties = {
    position: "absolute",
    background: "rgba(8,18,12,0.82)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
  };

  return (
    <AnimatePresence>
      <motion.div
        key="tour-root"
        className="fixed inset-0 z-[300]"
        style={{ direction: "rtl" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop — either one flat dim layer (no target to spotlight)
            or four panels framing a clear hole around the target so its
            real label/icon stay fully visible and unblurred. */}
        {hole ? (
          <>
            <div style={{ ...dimPanelStyle, top: 0, left: 0, right: 0, height: hole.top }} />
            <div
              style={{
                ...dimPanelStyle,
                top: hole.top + hole.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <div
              style={{
                ...dimPanelStyle,
                top: hole.top,
                left: 0,
                width: hole.left,
                height: hole.height,
              }}
            />
            <div
              style={{
                ...dimPanelStyle,
                top: hole.top,
                left: hole.left + hole.width,
                right: 0,
                height: hole.height,
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0" style={dimPanelStyle} />
        )}

        {/* Rising dust/sparkle particles — subtle ambience, not fixed to a
            magic number: derives from measured viewport height. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => {
            const left = 5 + ((i * 9.3) % 90);
            const size = 3 + (i % 4) * 2.5;
            const duration = 6 + (i % 5);
            const delay = (i % 6) * 0.6;
            const travel = (viewport.h || 800) + 40;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${left}%`,
                  bottom: -20,
                  width: size,
                  height: size,
                  background: i % 2 === 0 ? "rgba(201,168,76,0.4)" : "rgba(45,158,107,0.35)",
                  boxShadow:
                    i % 2 === 0 ? "0 0 8px rgba(201,168,76,0.5)" : "0 0 8px rgba(45,158,107,0.45)",
                }}
                animate={{ y: [0, -travel], opacity: [0, 1, 1, 0] }}
                transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
              />
            );
          })}
        </div>

        {/* Spotlight ring — traces exactly around the cutout hole above,
            so the glow visually frames the same rectangle that's actually
            left clear, instead of floating over a still-dimmed box. */}
        <AnimatePresence>
          {hole && (
            <motion.div
              key="spotlight"
              className="absolute rounded-2xl pointer-events-none"
              style={{
                border: "2px solid #C9A84C",
                boxShadow:
                  "0 0 0 4px rgba(201,168,76,0.18), 0 0 26px rgba(201,168,76,0.55)",
              }}
              initial={false}
              animate={{
                top: hole.top,
                left: hole.left,
                width: hole.width,
                height: hole.height,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={springBouncy}
            />
          )}
        </AnimatePresence>

        {/* Card container */}
        <div
          className="absolute inset-0 flex items-center justify-center px-4"
          style={{ paddingInlineEnd: "clamp(16px, 4vw, 300px)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={springBouncy}
              className="relative w-full max-w-md rounded-3xl overflow-hidden pattern-overlay"
              style={{
                background: "linear-gradient(160deg,#0D3D27 0%,#0A2A1B 100%)",
                border: "1px solid rgba(201,168,76,0.28)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.08)",
              }}
            >
              {/* Decorative eight-point star (rub el hizb motif) */}
              <svg
                width="84"
                height="84"
                viewBox="0 0 84 84"
                className="absolute -top-3 -right-3 pointer-events-none"
                style={{ opacity: 0.35 }}
              >
                <rect
                  x="18" y="18" width="34" height="34"
                  stroke="#C9A84C" strokeWidth="1.4" fill="none"
                  transform="rotate(15 35 35)"
                />
                <rect
                  x="18" y="18" width="34" height="34"
                  stroke="#E8C97A" strokeWidth="1.4" fill="none"
                  transform="rotate(60 35 35)"
                />
              </svg>

              {/* Skip */}
              <button
                onClick={finish}
                className="absolute top-4 left-4 text-xs px-2.5 py-1.5 rounded-full z-10"
                style={{
                  color: "rgba(232,201,122,0.6)",
                  fontFamily: "Cairo,sans-serif",
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  cursor: "pointer",
                }}
              >
                تخطي الجولة ✕
              </button>

              <div className="relative px-7 pt-16 pb-7">
                {/* Step counter */}
                <div
                  className="text-[11px] font-semibold tracking-widest uppercase mb-3"
                  style={{ color: "rgba(201,168,76,0.6)", fontFamily: "Cairo,sans-serif" }}
                >
                  الخطوة {stepIndex + 1} من {STEPS.length}
                </div>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
                  style={{ fontSize: 42, marginBottom: 14, lineHeight: 1, color: "#E8C97A" }}
                >
                  {step.icon}
                </motion.div>

                <h2
                  style={{
                    fontFamily: "Amiri,serif",
                    color: "#E8C97A",
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {step.title}
                </h2>

                <p
                  style={{
                    fontFamily: "Cairo,sans-serif",
                    color: "rgba(250,247,240,0.78)",
                    fontSize: 14.5,
                    lineHeight: 1.9,
                    marginBottom: step.bullets ? 14 : 22,
                  }}
                >
                  {step.description}
                </p>

                {step.bullets && (
                  <ul className="mb-6 space-y-2">
                    {step.bullets.map((b, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-start gap-2"
                        style={{
                          fontFamily: "Cairo,sans-serif",
                          color: "rgba(250,247,240,0.78)",
                          fontSize: 13.5,
                          lineHeight: 1.7,
                        }}
                      >
                        <span style={{ color: "#2D9E6B", flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span>{b}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mb-6">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className="rounded-full transition-all"
                      style={{
                        height: 5,
                        width: i === stepIndex ? 20 : 5,
                        background: i === stepIndex ? "#C9A84C" : "rgba(201,168,76,0.22)",
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {!isFirst && (
                    <button
                      onClick={goBack}
                      className="px-4 py-3 rounded-2xl text-sm font-semibold"
                      style={{
                        fontFamily: "Cairo,sans-serif",
                        color: "rgba(232,201,122,0.75)",
                        background: "rgba(201,168,76,0.08)",
                        border: "1px solid rgba(201,168,76,0.2)",
                        cursor: "pointer",
                      }}
                    >
                      السابق
                    </button>
                  )}
                  <motion.button
                    onClick={goNext}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold"
                    style={{
                      fontFamily: "Cairo,sans-serif",
                      color: "#1A1208",
                      background: "linear-gradient(135deg,#C9A84C,#2D9E6B)",
                      boxShadow: "0 6px 20px rgba(201,168,76,0.35)",
                      cursor: "pointer",
                    }}
                  >
                    {step.cta ?? (isLast ? "إنهاء" : "التالي")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
