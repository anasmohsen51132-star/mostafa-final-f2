"use client";
// src/app/(student)/lecture/[id]/page.tsx
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "@/hooks/useAuth";
import { VideoPlayer } from "@/components/courses/VideoPlayer";
import { useToast } from "@/store/uiStore";
import type { Video, PDF, Quiz, Homework, Question, QuizAttempt } from "@/types";

type Tab = "videos" | "pdfs" | "quiz" | "homework";

export default function LecturePage() {
  const { id }   = useParams<{ id: string }>();
  const toast    = useToast();
  const qc       = useQueryClient();
  const [activeTab,      setActiveTab]      = useState<Tab>("videos");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizAnswers,    setQuizAnswers]    = useState<Record<string, string>>({});
  const [quizResult,     setQuizResult]     = useState<{
    score: number; total: number; percentage: number; passed: boolean;
    attemptNumber: number; attemptsRemaining: number;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lecture", id],
    queryFn:  () => fetchWithAuth(`/api/lectures/${id}`),
    enabled:  !!id,
  });
  const lecture = data?.data;

  // Gate quiz = always the first quiz (loaded immediately for lock check)
  const gateQuizId: string | null = lecture?.quizzes?.[0]?.id ?? null;

  const { data: gateAttemptsData, isLoading: isGateLoading, isFetching: isGateFetching } = useQuery({
    queryKey: ["quiz-attempts", gateQuizId],
    queryFn:  () => fetchWithAuth(`/api/quizzes/${gateQuizId}/submit`),
    enabled:  !!gateQuizId,
  });

  // Active quiz = whichever quiz the student opened (React Query dedupes if same as gate)
  const activeQuizId = selectedQuizId ?? gateQuizId;
  const { data: attemptsData } = useQuery({
    queryKey: ["quiz-attempts", activeQuizId],
    queryFn:  () => fetchWithAuth(`/api/quizzes/${activeQuizId}/submit`),
    enabled:  !!activeQuizId,
  });
  const attemptHistory: QuizAttempt[] = attemptsData?.data?.attempts ?? [];
  const attemptsRemaining: number     = attemptsData?.data?.attemptsRemaining ?? 3;
  // hasPassed must come from the gate quiz, not whichever quiz is currently open
  const hasPassed: boolean            = gateAttemptsData?.data?.hasPassed ?? false;

  const submitQuizMutation = useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: Record<string, string> }) =>
      fetchWithAuth(`/api/quizzes/${quizId}/submit`, { method:"POST", body:JSON.stringify({ answers }) }),
    onSuccess: (res) => {
      if (res.success) {
        setQuizResult(res.data);
        toast.success(`✅ تم تسليم الاختبار — ${res.data.percentage}٪`);
        qc.invalidateQueries({ queryKey: ["lecture", id] });
        qc.invalidateQueries({ queryKey: ["quiz-attempts", selectedQuizId] });
      } else {
        toast.error(res.error ?? "خطأ في التسليم");
      }
    },
  });

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = ([
    { id:"videos" as Tab,   label:"فيديوهات", icon:"🎥", count: lecture?.videos?.length   ?? 0 },
    { id:"pdfs" as Tab,     label:"ملفات",    icon:"📄", count: lecture?.pdfs?.length     ?? 0 },
    { id:"quiz" as Tab,     label:"اختبارات", icon:"📝", count: lecture?.quizzes?.length  ?? 0 },
    { id:"homework" as Tab, label:"واجبات",   icon:"📋", count: lecture?.homework?.length ?? 0 },
  ] as { id: Tab; label: string; icon: string; count: number }[]).filter((t) => t.count > 0);

  // ── Quiz gate check ──
  const quizRequirement = lecture?.quizRequirement ?? "NONE";
  const isContentLocked = quizRequirement === "MUST_PASS" && !hasPassed;

  // If this lecture requires passing a quiz, wait for the pass/fail check to
  // resolve before showing anything — otherwise the page briefly renders
  // "locked" (hasPassed defaults to false) before flipping to "unlocked"
  // once the gate-quiz attempts finish loading.
  const waitingOnGateCheck = quizRequirement === "MUST_PASS" && !!gateQuizId && (isGateLoading || isGateFetching) && !gateAttemptsData;

  if (isLoading || waitingOnGateCheck) return (
    <div style={{ direction:"rtl" }}>
      <div className="skeleton rounded-3xl h-32 mb-6" />
      <div className="skeleton rounded-2xl h-64" />
    </div>
  );

  if (!lecture) return (
    <div className="text-center py-20" style={{ direction:"rtl" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>⚠️</div>
      <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:24 }}>المحاضرة غير موجودة</h3>
    </div>
  );

  return (
    <div style={{ direction:"rtl" }}>
      {/* Header */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="mb-6">
        <h1 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:"clamp(22px,4vw,30px)", marginBottom:6 }}>
          {lecture.title}
        </h1>
        {lecture.description && (
          <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:15, lineHeight:1.75 }}>{lecture.description}</p>
        )}
        {/* Quiz requirement notice */}
        {quizRequirement === "MUST_PASS" && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: hasPassed ? "rgba(45,158,107,0.08)" : "rgba(220,38,38,0.06)",
              border: `1px solid ${hasPassed ? "rgba(45,158,107,0.3)" : "rgba(220,38,38,0.2)"}`,
              display:"inline-flex" }}>
            <span>{hasPassed ? "✅" : "🔒"}</span>
            <span style={{ fontFamily:"Cairo,sans-serif", fontSize:13,
              color: hasPassed ? "#1A6B47" : "#DC2626", fontWeight:600 }}>
              {hasPassed ? "لقد اجتزت الاختبار — المحتوى مفتوح" : "يجب اجتياز الاختبار لفتح محتوى هذا الدرس"}
            </span>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedQuizId(null); setQuizResult(null); }}
              style={{ padding:"8px 16px", borderRadius:12, border:"1.5px solid",
                borderColor: activeTab===t.id ? "#C9A84C" : "rgba(201,168,76,0.25)",
                background:  activeTab===t.id ? "rgba(201,168,76,0.12)" : "#fff",
                color:       activeTab===t.id ? "#8B6914" : "#7A6E5A",
                fontFamily:"Cairo,sans-serif", fontSize:13,
                fontWeight: activeTab===t.id ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}>
              {t.icon} {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22 }}>

          {/* ── VIDEOS ── */}
          {(activeTab==="videos" || tabs.length===0) && (
            <div className="space-y-8">
              {/* Quiz gate wall */}
              {isContentLocked ? (
                <LockedContentWall onGoToQuiz={() => setActiveTab("quiz")} />
              ) : lecture.videos?.length ? (
                lecture.videos.map((video: Video) => (
                  <div key={video.id}>
                    <h3 style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:15, fontWeight:700, marginBottom:10 }}>
                      🎥 {video.title}
                    </h3>
                    <VideoPlayer youtubeId={video.youtubeId} title={video.title} lectureId={id as string} videoId={video.id} />
                  </div>
                ))
              ) : (
                <EmptyTab icon="🎥" label="لا توجد فيديوهات" />
              )}
            </div>
          )}

          {/* ── PDFs ── */}
          {activeTab==="pdfs" && (
            <div className="space-y-3">
              {isContentLocked ? <LockedContentWall onGoToQuiz={() => setActiveTab("quiz")} /> :
                lecture.pdfs?.map((pdf: PDF) => (
                  <motion.a key={pdf.id} href={pdf.fileUrl} target="_blank" rel="noopener noreferrer"
                    whileHover={{ x:-4 }}
                    className="flex items-center gap-4 p-5 rounded-2xl"
                    style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.2)", boxShadow:"0 2px 8px rgba(26,18,8,0.04)", textDecoration:"none", display:"flex" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:"rgba(201,168,76,0.12)" }}>📄</div>
                    <div>
                      <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:15, fontWeight:600 }}>{pdf.title}</p>
                      <p style={{ fontFamily:"Cairo,sans-serif", color:"#C9A84C", fontSize:12, marginTop:2 }}>اضغط لفتح الملف ↗</p>
                    </div>
                  </motion.a>
                ))
              }
            </div>
          )}

          {/* ── QUIZ ── */}
          {activeTab==="quiz" && (
            <div>
              {!selectedQuizId ? (
                <div className="space-y-3">
                  {lecture.quizzes?.map((quiz: Quiz) => {
                    const myBest = attemptHistory.length > 0 ? Math.max(...attemptHistory.map((a) => a.percentage)) : null;
                    return (
                      <motion.div key={quiz.id} whileHover={{ x:-4 }}
                        className="p-5 rounded-2xl cursor-pointer"
                        style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.2)", boxShadow:"0 2px 8px rgba(26,18,8,0.04)" }}
                        onClick={() => { setSelectedQuizId(quiz.id); setQuizAnswers({}); setQuizResult(null); }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background:"rgba(201,168,76,0.12)" }}>📝</div>
                            <div>
                              <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:15, fontWeight:600 }}>{quiz.title}</p>
                              <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:12 }}>
                                {quiz._count?.questions ?? quiz.questions?.length ?? 0} سؤال
                                {quiz.timeLimit ? ` — ${quiz.timeLimit} دقيقة` : ""}
                              </p>
                            </div>
                          </div>
                          <span style={{ color:"#C9A84C", fontSize:20 }}>←</span>
                        </div>
                        {myBest !== null && (
                          <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop:"1px solid rgba(201,168,76,0.12)" }}>
                            <span style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:12 }}>
                              أفضل نتيجة: <span style={{ color:"#C9A84C", fontWeight:700 }}>{myBest}٪</span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <QuizPlayer
                  quiz={lecture.quizzes?.find((q: Quiz) => q.id === selectedQuizId)!}
                  answers={quizAnswers}
                  onAnswer={(qId, cId) => setQuizAnswers((a) => ({ ...a, [qId]: cId }))}
                  onSubmit={() => submitQuizMutation.mutate({ quizId: selectedQuizId, answers: quizAnswers })}
                  onBack={() => { setSelectedQuizId(null); setQuizResult(null); }}
                  result={quizResult}
                  isSubmitting={submitQuizMutation.isPending}
                  attemptHistory={attemptHistory}
                  attemptsRemaining={attemptsRemaining}
                />
              )}
            </div>
          )}

          {/* ── HOMEWORK ── */}
          {activeTab==="homework" && (
            <div className="space-y-3">
              {lecture.homework?.map((hw: Homework) => (
                <div key={hw.id} className="p-5 rounded-2xl" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.2)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:"rgba(201,168,76,0.12)" }}>📋</div>
                    <h3 style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:15, fontWeight:700 }}>{hw.title}</h3>
                  </div>
                  <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13 }}>
                    {hw.questions?.length ?? hw._count?.questions ?? 0} سؤال — يُسلَّم للمعلم مباشرة
                  </p>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Locked content wall ───────────────────────────────────
function LockedContentWall({ onGoToQuiz }: { onGoToQuiz: () => void }) {
  return (
    <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
      className="text-center py-16 rounded-2xl"
      style={{ background:"rgba(220,38,38,0.04)", border:"1.5px solid rgba(220,38,38,0.18)" }}>
      <div style={{ fontSize:56, marginBottom:12 }}>🔒</div>
      <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:24, marginBottom:10 }}>
        المحتوى مقفل
      </h3>
      <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:15, marginBottom:24 }}>
        يجب اجتياز الاختبار أولاً لفتح هذا المحتوى
      </p>
      <button onClick={onGoToQuiz}
        style={{ padding:"12px 32px", borderRadius:14, border:"none",
          background:"linear-gradient(135deg,#C9A84C,#8B6914)",
          boxShadow:"0 6px 20px rgba(201,168,76,0.4)",
          color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:15, cursor:"pointer" }}>
        📝 اذهب إلى الاختبار
      </button>
    </motion.div>
  );
}

// ── Quiz Player ───────────────────────────────────────────
function QuizPlayer({
  quiz, answers, onAnswer, onSubmit, onBack, result, isSubmitting, attemptHistory, attemptsRemaining,
}: {
  quiz: Quiz;
  answers: Record<string, string>;
  onAnswer: (qId: string, cId: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  result: { score: number; total: number; percentage: number; passed: boolean; attemptNumber: number; attemptsRemaining: number } | null;
  isSubmitting: boolean;
  attemptHistory: QuizAttempt[];
  attemptsRemaining: number;
}) {
  const answered = Object.keys(answers).length;
  const total    = quiz.questions?.length ?? 0;
  const noAttemptsLeft = attemptsRemaining <= 0 && !result;

  if (result) return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      className="text-center py-12"
      style={{ background:"#fff", borderRadius:24, border:"1px solid rgba(201,168,76,0.2)", padding:40 }}>
      <div style={{ fontSize:72, marginBottom:16 }}>{result.passed ? "🎉" : "💪"}</div>
      <h2 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:32, marginBottom:8 }}>
        {result.passed ? "أحسنت! لقد نجحت!" : "لم تنجح هذه المرة"}
      </h2>
      <div style={{ fontFamily:"Amiri,serif", color:"#C9A84C", fontSize:56, fontWeight:700, marginBottom:4 }}>
        {result.percentage}٪
      </div>
      <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:15, marginBottom:8 }}>
        {result.score} / {result.total} إجابة صحيحة
      </p>
      <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13, marginBottom:24 }}>
        المحاولة رقم {result.attemptNumber} •
        {result.attemptsRemaining > 0
          ? ` متبقٍ لك ${result.attemptsRemaining} محاولة`
          : " لا محاولات متبقية"}
      </p>
      <button onClick={onBack}
        style={{ padding:"12px 32px", borderRadius:14, border:"none",
          background:"linear-gradient(135deg,#C9A84C,#8B6914)",
          color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:15, cursor:"pointer" }}>
        العودة
      </button>
    </motion.div>
  );

  if (noAttemptsLeft) return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      className="text-center py-16 rounded-2xl"
      style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.15)" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>❌</div>
      <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:24, marginBottom:10 }}>
        استُنفدت جميع المحاولات
      </h3>
      <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:15, marginBottom:16 }}>
        لقد استخدمت الحد الأقصى من المحاولات المسموح بها (3 محاولات)
      </p>
      {/* Attempt history */}
      {attemptHistory.length > 0 && (
        <div className="mt-4 text-right px-8 space-y-2">
          {attemptHistory.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.12)" }}>
              <span style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13 }}>المحاولة {a.attemptNumber}</span>
              <span style={{ fontFamily:"Cairo,sans-serif", color: a.passed ? "#2D9E6B" : "#DC2626", fontSize:14, fontWeight:700 }}>
                {a.percentage}٪ {a.passed ? "✅" : "❌"}
              </span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onBack} style={{ marginTop:20, padding:"10px 24px", borderRadius:12, border:"1px solid rgba(201,168,76,0.3)", background:"none", color:"#8B6914", fontFamily:"Cairo,sans-serif", fontWeight:600, fontSize:14, cursor:"pointer" }}>
        ← عودة
      </button>
    </motion.div>
  );

  return (
    <div>
      {/* Attempt counter + history */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <button onClick={onBack} style={{ fontFamily:"Cairo,sans-serif", color:"#C9A84C", fontSize:13, background:"none", border:"none", cursor:"pointer" }}>
          ← عودة
        </button>
        <div className="flex items-center gap-3">
          {attemptHistory.length > 0 && (
            <div className="flex gap-2">
              {attemptHistory.map((a) => (
                <span key={a.id} style={{
                  padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                  background: a.passed ? "rgba(45,158,107,0.1)" : "rgba(220,38,38,0.08)",
                  color: a.passed ? "#2D9E6B" : "#DC2626",
                  fontFamily:"Cairo,sans-serif",
                }}>
                  {a.attemptNumber}: {a.percentage}٪
                </span>
              ))}
            </div>
          )}
          <span style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13 }}>
            محاولة {attemptHistory.length + 1} / 3
          </span>
        </div>
        <span style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13 }}>{answered} / {total} مجاب</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full mb-8" style={{ background:"rgba(201,168,76,0.15)" }}>
        <motion.div className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#C9A84C,#8B6914)" }}
          animate={{ width: `${total ? (answered/total)*100 : 0}%` }} transition={{ duration:0.3 }} />
      </div>

      <div className="space-y-6">
        {quiz.questions?.map((q: Question, qi: number) => (
          <div key={q.id} className="p-6 rounded-2xl"
            style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 2px 12px rgba(26,18,8,0.04)" }}>
            <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:15, fontWeight:600, marginBottom:12 }}>
              {qi+1}. {q.text}
            </p>
            {q.imageUrl && <img src={q.imageUrl} alt="سؤال" className="rounded-xl mb-4 max-h-48 object-contain" draggable={false} onContextMenu={(e) => e.preventDefault()} />}
            <div className="space-y-2">
              {q.choices?.map((c) => (
                <button key={c.id} onClick={() => onAnswer(q.id, c.id)}
                  style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:"1.5px solid",
                    borderColor: answers[q.id]===c.id ? "#C9A84C" : "rgba(201,168,76,0.2)",
                    background:  answers[q.id]===c.id ? "rgba(201,168,76,0.12)" : "rgba(250,247,240,0.5)",
                    color:"#1A1208", fontFamily:"Cairo,sans-serif", fontSize:14, textAlign:"right",
                    cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, border:"2px solid",
                    borderColor: answers[q.id]===c.id ? "#C9A84C" : "rgba(201,168,76,0.35)",
                    background:  answers[q.id]===c.id ? "#C9A84C" : "transparent", transition:"all 0.15s" }} />
                  {c.text}
                  {c.imageUrl && <img src={c.imageUrl} alt="" className="h-8 object-contain rounded" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={onSubmit} disabled={answered<total || isSubmitting}
          style={{ padding:"14px 48px", borderRadius:16, border:"none",
            background: answered<total ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg,#C9A84C,#8B6914)",
            color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:16,
            cursor: answered<total ? "not-allowed" : "pointer",
            boxShadow: answered>=total ? "0 6px 20px rgba(201,168,76,0.4)" : "none", transition:"all 0.2s" }}>
          {isSubmitting ? "⏳ جارٍ التسليم..." :
           answered<total ? `أجب على ${total-answered} سؤال متبقي` : "✅ تسليم الاختبار"}
        </button>
      </div>
    </div>
  );
}

function EmptyTab({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center py-16" style={{ background:"#fff", borderRadius:20, border:"1px solid rgba(201,168,76,0.15)" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:15 }}>{label}</p>
    </div>
  );
}
