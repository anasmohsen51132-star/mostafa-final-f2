"use client";
// src/components/onboarding/WelcomeTour.tsx
// First-run guided tour for students — Academy edition (gold/emerald identity).
//
// WHO SEES IT / HOW MANY TIMES: driven entirely by the student's own
// `hasSeenOnboarding` flag on the User row (see prisma/schema.prisma). That
// column defaults to `true` for everyone, and is only ever created as
// `false` by POST /api/auth/register at the moment a brand-new account is
// made (see that route). That means:
//   - an already-registered student (or anyone who existed before this
//     feature shipped) is `true` from day one and never sees this, on any
//     device or browser — the check isn't "has this browser seen it"
//     (localStorage), it's "is this account brand new".
//   - a freshly-registered student is `false` exactly once. The moment
//     they finish or skip the tour, WelcomeTour calls
//     POST /api/auth/onboarding-seen, which flips the flag server-side —
//     so it's gone for good, on every device, even after clearing the
//     browser.
//
// Walks the student through every page — لوحة التحكم، الكورسات، كود
// الاشتراك، كورساتي، الملف الشخصي — driven entirely by the "التالي" button:
// each step spotlights the matching sidebar item and navigates the real
// app to that page in the background, so what the student sees behind the
// tour card is the actual page being described.
//
// SPOTLIGHT FIX: an older version drew a single full-screen dim/blur layer
// and placed a glowing ring "on top" of it — but the ring was purely
// decorative, the dim layer underneath still covered the real sidebar item,
// so the icon + page name inside the "highlighted" box were invisible. This
// version instead builds the dim layer out of four separate panels framing
// a hole around the target element, so that exact rectangle is left
// completely untouched (no tint, no blur) and the real sidebar label reads
// through it, exactly like the ring around it implies. The spotlight only
// runs at desktop widths (≥1024px, matching the sidebar's own "hidden
// lg:flex" breakpoint) — on phone/tablet the sidebar is a closed drawer,
// so the card is simply centered on its own.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";
import { springBouncy } from "@/lib/motion-presets";
import { fetchWithAuth } from "@/hooks/useAuth";

// Small line-icon set in the card's own gold, used instead of platform
// emoji — the "✨" sparkle glyph rendered as a mismatched, cartoonish
// cluster next to the thin geometric star motif (that's the graphic that
// needed replacing). These are plain stroke paths so they always render
// identically, in the exact gold tone, on every device.
function StepIcon({ children, size = 40 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E8C97A"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

// Small eight-point star (two overlapping squares — a "rub el hizb" motif),
// scaled down and repeated in all four corners of the card as a restrained
// manuscript-style frame instead of a single one-off accent.
function CornerOrnament({ className }: { className: string }) {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      className={`absolute pointer-events-none ${className}`}
      style={{ opacity: 0.3 }}
    >
      <rect x="9" y="9" width="20" height="20" stroke="#C9A84C" strokeWidth="1.2" fill="none" transform="rotate(15 19 19)" />
      <rect x="9" y="9" width="20" height="20" stroke="#E8C97A" strokeWidth="1.2" fill="none" transform="rotate(60 19 19)" />
    </svg>
  );
}

// Manuscript-style divider — a thin line, a small rotated diamond, a thin
// line — echoing the ornamental section breaks used in Arabic manuscripts.
function OrnamentDivider() {
  return (
    <svg width="120" height="14" viewBox="0 0 120 14" className="mb-4" style={{ display: "block" }}>
      <line x1="0" y1="7" x2="46" y2="7" stroke="#C9A84C" strokeOpacity="0.4" strokeWidth="1" />
      <rect x="54" y="1" width="12" height="12" fill="none" stroke="#C9A84C" strokeWidth="1.3" transform="rotate(45 60 7)" />
      <line x1="74" y1="7" x2="120" y2="7" stroke="#C9A84C" strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}

interface TourStep {
  id: string;
  route?: string;
  targetId?: string; // matches data-tour-id on the sidebar item
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
  cta?: string; // custom label for the "next" button on this step
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: <span style={{ fontFamily: "Amiri,serif", fontSize: 44, color: "#E8C97A" }}>﷽</span>,
    title: "أهلاً بيك في أكاديمية مستر مصطفى",
    description:
      "هناخدك في جولة سريعة على المنصة عشان تتعرف على كل صفحة وإزاي تستخدمها كطالب. تقدر تتخطى الجولة في أي وقت.",
    cta: "ابدأ الجولة",
  },
  {
    id: "dashboard",
    route: "/dashboard",
    targetId: "dashboard",
    icon: (
      <StepIcon>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </StepIcon>
    ),
    title: "لوحة التحكم",
    description:
      "دي صفحتك الرئيسية. هتلاقي فيها نظرة عامة على تقدمك، آخر محاضرة كنت بتذاكر فيها عشان تكمل منها على طول، وإحصائيات بسيطة عن نشاطك.",
  },
  {
    id: "courses",
    route: "/courses",
    targetId: "courses",
    icon: (
      <StepIcon>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </StepIcon>
    ),
    title: "الكورسات",
    description:
      "هنا بتلاقي كل الكورسات المتاحة على المنصة، تقدر تتصفحها وتشوف تفاصيلها حتى لو لسه مش مشترك فيها، عشان تعرف تختار الكورس المناسب لصفك الدراسي.",
  },
  {
    id: "redeem",
    route: "/redeem",
    targetId: "redeem",
    icon: (
      <StepIcon>
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </StepIcon>
    ),
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
    icon: (
      <StepIcon>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </StepIcon>
    ),
    title: "كورساتي",
    description:
      "دي الكورسات اللي انت مشترك فيها فعليًا بعد ما فعّلت الكود. من هنا بتدخل على المحاضرات، تكمل من حيث ما وقفت، وتحل الواجبات والاختبارات.",
  },
  {
    id: "profile",
    route: "/profile",
    targetId: "profile",
    icon: (
      <StepIcon>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </StepIcon>
    ),
    title: "الملف الشخصي",
    description:
      "هنا بياناتك الشخصية: اسمك، رقم الهاتف اللي بتسجل بيه دخولك، وصفك الدراسي. تقدر تراجعها في أي وقت.",
  },
  {
    id: "permissions",
    route: "/dashboard",
    icon: (
      <StepIcon>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </StepIcon>
    ),
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
    icon: (
      <StepIcon size={44}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
      </StepIcon>
    ),
    title: "جاهز تبدأ!",
    description:
      "كده عرفت تتحرك في المنصة براحتك. لو محتاج تراجع أي حاجة، الصفحات كلها موجودة دايمًا في القائمة الجانبية. بالتوفيق في رحلتك مع اللغة العربية!",
    cta: "ابدأ رحلتي",
  },
];

const SPOTLIGHT_PADDING = 6;

// Used for the ambient floating-letters animation — a handful of Arabic
// huroof drifting upward, standing in for generic "sparkle" decoration
// with something that actually reflects what the student is here to learn.
const ARABIC_LETTERS = ["ا", "ب", "ت", "ث", "ج", "ح", "د", "ر", "س", "ع", "ق", "م"];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  userId: string;
  // false only for an account created moments ago by /api/auth/register.
  // Anything else (true, or missing/legacy data) never triggers the tour.
  hasSeenOnboarding: boolean;
}

export function WelcomeTour({ userId, hasSeenOnboarding }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const checkedRef = useRef(false);

  // Decide, once, whether this (brand-new) student needs the tour.
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    if (hasSeenOnboarding === false) {
      // Small delay so the tour doesn't collide with the name-splash
      // welcome animation that already plays on first dashboard visit.
      const t = setTimeout(() => setActive(true), 3200);
      return () => clearTimeout(t);
    }
  }, [hasSeenOnboarding]);

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
    // Best-effort: flips hasSeenOnboarding server-side so the tour never
    // shows again for this account, on any device — this is the source of
    // truth, not a local flag. A failure here just means this one account
    // might see the tour again on a future session; nothing else depends
    // on it succeeding immediately.
    fetchWithAuth("/api/auth/onboarding-seen", { method: "POST" }).catch(() => {});
  }, []);

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

        {/* Floating Arabic letters — ambient animation themed to the
            subject being taught (this is an Arabic-language academy), in
            place of generic decoration. Derives from measured viewport
            height so the drift always clears the screen on any device. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {ARABIC_LETTERS.map((letter, i) => {
            const left = 4 + ((i * 8.1) % 92);
            const size = 15 + (i % 4) * 6;
            const duration = 10 + (i % 5) * 1.8;
            const delay = (i % 7) * 1.15;
            const travel = (viewport.h || 800) + 60;
            const drift = (i % 2 === 0 ? 1 : -1) * (8 + (i % 3) * 6);
            return (
              <motion.span
                key={i}
                className="absolute select-none"
                style={{
                  left: `${left}%`,
                  bottom: -40,
                  fontFamily: "Amiri,serif",
                  fontSize: size,
                  color: i % 2 === 0 ? "rgba(201,168,76,0.3)" : "rgba(45,158,107,0.26)",
                }}
                animate={{
                  y: [0, -travel],
                  x: [0, drift, 0],
                  opacity: [0, 1, 1, 0],
                  rotate: [0, i % 2 === 0 ? 10 : -10, 0],
                }}
                transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
              >
                {letter}
              </motion.span>
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
              style={{ border: "2px solid #C9A84C" }}
              initial={false}
              animate={{
                top: hole.top,
                left: hole.left,
                width: hole.width,
                height: hole.height,
                opacity: 1,
                boxShadow: [
                  "0 0 0 4px rgba(201,168,76,0.18), 0 0 22px rgba(201,168,76,0.5)",
                  "0 0 0 6px rgba(201,168,76,0.24), 0 0 32px rgba(201,168,76,0.65)",
                  "0 0 0 4px rgba(201,168,76,0.18), 0 0 22px rgba(201,168,76,0.5)",
                ],
              }}
              exit={{ opacity: 0 }}
              transition={{
                top: springBouncy, left: springBouncy, width: springBouncy, height: springBouncy,
                boxShadow: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          )}
        </AnimatePresence>

        {/* Card container — centered on phone/tablet; on desktop (≥1024px,
            the exact breakpoint the sidebar itself switches on at) an extra
            right-side gap keeps the card clear of the fixed 256px sidebar.
            RESPONSIVE FIX: this used to be a single inline clamp(4vw) that
            also applied on tablet, where there's no sidebar to avoid,
            silently skewing the card off-center for no reason. */}
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:pr-[300px] lg:pl-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={springBouncy}
              className="relative w-full max-w-[440px] sm:max-w-[460px] rounded-3xl overflow-hidden pattern-overlay"
              style={{
                background: "linear-gradient(160deg,#0D3D27 0%,#0A2A1B 100%)",
                border: "1px solid rgba(201,168,76,0.28)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.08)",
                maxHeight: "min(88vh, 720px)",
                overflowY: "auto",
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 pointer-events-none"
                style={{ height: 4, background: "linear-gradient(90deg,transparent,#C9A84C,#E8C97A,#C9A84C,transparent)" }}
              />

              {/* Four-corner geometric frame — a restrained echo of
                  Islamic manuscript corner medallions, on all four
                  corners instead of a single one-off accent. */}
              <CornerOrnament className="-top-2 -right-2" />
              <CornerOrnament className="-top-2 -left-2" />
              <CornerOrnament className="-bottom-2 -right-2" />
              <CornerOrnament className="-bottom-2 -left-2" />

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

              <div className="relative px-6 sm:px-7 pt-16 pb-6 sm:pb-7">
                {/* Step counter */}
                <div
                  className="text-[11px] font-semibold tracking-widest uppercase mb-3"
                  style={{ color: "rgba(201,168,76,0.6)", fontFamily: "Cairo,sans-serif" }}
                >
                  الخطوة {stepIndex + 1} من {STEPS.length}
                </div>

                {/* Icon badge */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
                  className="flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    marginBottom: 16,
                    background: "radial-gradient(circle at 35% 30%, rgba(201,168,76,0.28), rgba(45,158,107,0.1) 72%)",
                    border: "1.5px solid rgba(201,168,76,0.4)",
                    boxShadow: "0 0 24px rgba(201,168,76,0.22), inset 0 0 18px rgba(201,168,76,0.08)",
                  }}
                >
                  {step.icon}
                </motion.div>

                <h2
                  style={{
                    fontFamily: "Amiri,serif",
                    color: "#E8C97A",
                    fontSize: "clamp(20px, 5vw, 25px)",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {step.title}
                </h2>

                <OrnamentDivider />

                <p
                  style={{
                    fontFamily: "Cairo,sans-serif",
                    color: "rgba(250,247,240,0.78)",
                    fontSize: "clamp(13.5px, 3.6vw, 14.5px)",
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
                    {step.cta ?? (isLast ? "إنهاء" : "التالي")} {isLast ? "" : "←"}
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
