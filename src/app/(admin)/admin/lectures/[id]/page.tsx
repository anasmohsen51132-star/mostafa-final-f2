"use client";
// src/app/(admin)/admin/lectures/[id]/page.tsx
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/useAuth";
import { useToast } from "@/store/uiStore";
import { decodeYouTubeId, extractYouTubeId } from "@/lib/utils";
import { QUIZ_REQUIREMENT_LABELS } from "@/types";
import type { Video, PDF, Quiz, Homework, Course, QuizRequirement } from "@/types";

type ActiveTab = "videos" | "pdfs" | "quizzes" | "homework" | "settings";

const REQUIREMENT_OPTIONS: { value: QuizRequirement; label: string; desc: string; color: string }[] = [
  { value: "NONE",      label: "بدون اختبار",      desc: "الدرس مفتوح دائماً للطلاب",               color: "#2D9E6B" },
  { value: "OPTIONAL",  label: "اختبار اختياري",   desc: "يمكن مشاهدة الدرس بدون اجتياز الاختبار", color: "#C9A84C" },
  { value: "MUST_PASS", label: "اختبار إجباري",    desc: "يجب اجتياز الاختبار لفتح المحتوى",       color: "#DC2626" },
];

export default function LectureEditPage() {
  const { id }   = useParams<{ id: string }>();
  const toast    = useToast();
  const qc       = useQueryClient();
  const [tab, setTab] = useState<ActiveTab>("videos");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl,   setVideoUrl]   = useState("");
  const [pdfTitle,   setPdfTitle]   = useState("");
  const [pdfUrl,     setPdfUrl]     = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lecture", id],
    queryFn:  () => fetchWithAuth(`/api/lectures/${id}`),
    enabled:  !!id,
  });
  const lecture = data?.data;

  const addVideo = useMutation({
    mutationFn: () => fetchWithAuth("/api/videos", {
      method: "POST",
      body: JSON.stringify({ lectureId: id, title: videoTitle, youtubeUrl: videoUrl }),
    }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تم إضافة الفيديو"); setVideoTitle(""); setVideoUrl(""); qc.invalidateQueries({ queryKey: ["admin-lecture", id] }); }
      else toast.error(res.error ?? "فشل");
    },
  });

  const deleteVideo = useMutation({
    mutationFn: (videoId: string) => fetchWithAuth("/api/videos", { method: "DELETE", body: JSON.stringify({ id: videoId }) }),
    onSuccess: () => { toast.success("✅ تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-lecture", id] }); },
  });

  const addPDF = useMutation({
    mutationFn: () => fetchWithAuth("/api/pdfs", {
      method: "POST",
      body: JSON.stringify({ lectureId: id, title: pdfTitle, fileUrl: pdfUrl }),
    }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تم إضافة الملف"); setPdfTitle(""); setPdfUrl(""); qc.invalidateQueries({ queryKey: ["admin-lecture", id] }); }
      else toast.error(res.error ?? "فشل");
    },
  });

  const deletePDF    = useMutation({ mutationFn: (pdfId: string) => fetchWithAuth("/api/pdfs", { method: "DELETE", body: JSON.stringify({ id: pdfId }) }), onSuccess: () => { toast.success("✅ تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-lecture", id] }); } });
  const deleteQuiz   = useMutation({ mutationFn: (qId: string)   => fetchWithAuth("/api/quizzes", { method: "DELETE", body: JSON.stringify({ id: qId }) }), onSuccess: () => { toast.success("✅ تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-lecture", id] }); } });

  const updateSettings = useMutation({
    mutationFn: (body: { quizRequirement: QuizRequirement; quizPassScore: number }) =>
      fetchWithAuth(`/api/lectures/${id}/settings`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تم حفظ الإعدادات"); qc.invalidateQueries({ queryKey: ["admin-lecture", id] }); }
      else toast.error(res.error ?? "فشل");
    },
  });

  const TABS: { id: ActiveTab; label: string; icon: string }[] = [
    { id: "videos",   label: "فيديوهات",  icon: "🎥" },
    { id: "pdfs",     label: "ملفات PDF", icon: "📄" },
    { id: "quizzes",  label: "اختبارات",  icon: "📝" },
    { id: "homework", label: "واجبات",    icon: "📋" },
    { id: "settings", label: "الإعدادات", icon: "⚙️" },
  ];

  if (isLoading) return (
    <div style={{ direction: "rtl" }}>
      <div className="skeleton rounded-2xl h-10 w-64 mb-6" />
      <div className="skeleton rounded-2xl h-64" />
    </div>
  );
  if (!lecture) return (
    <div className="text-center py-20" style={{ direction: "rtl" }}>
      <p style={{ fontFamily: "Cairo,sans-serif", color: "#7A6E5A" }}>المحاضرة غير موجودة</p>
      <Link href="/admin/lectures" style={{ color: "#C9A84C", fontFamily: "Cairo,sans-serif", textDecoration: "none" }}>← عودة</Link>
    </div>
  );

  const fieldInput: React.CSSProperties = {
    flex: 1, padding: "10px 13px", borderRadius: 10,
    border: "1.5px solid rgba(201,168,76,0.25)", background: "#FAFAF8",
    color: "#1A1208", fontFamily: "Cairo,sans-serif", fontSize: 13,
    outline: "none", direction: "rtl", transition: "border-color 0.2s",
  };

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/lectures" style={{ color: "#C9A84C", fontFamily: "Cairo,sans-serif", fontSize: 13, textDecoration: "none" }}>← المحاضرات</Link>
        </div>
        <h1 style={{ fontFamily: "Amiri,serif", color: "#1A1208", fontSize: 28, marginBottom: 4 }}>{lecture.title}</h1>

        {/* Quiz requirement badge */}
        <div className="flex flex-wrap gap-2 mt-2">
          {(() => {
            const req = lecture.quizRequirement ?? "NONE";
            const opt = REQUIREMENT_OPTIONS.find((o) => o.value === req) ?? REQUIREMENT_OPTIONS[0];
            return (
              <span style={{ padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:`${opt.color}15`, color:opt.color, border:`1px solid ${opt.color}30`, fontFamily:"Cairo,sans-serif" }}>
                {opt.label}
              </span>
            );
          })()}
          {lecture.courses?.map(({ course }: { course: Course }) => (
            <span key={course.id} style={{ padding:"3px 10px", borderRadius:8, fontSize:12, background:"rgba(26,107,71,0.08)", color:"#1A6B47", border:"1px solid rgba(26,107,71,0.2)", fontFamily:"Cairo,sans-serif" }}>
              {course.icon} {course.title}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"8px 18px", borderRadius:12, border:"1.5px solid",
              borderColor: tab===t.id ? "#C9A84C" : "rgba(201,168,76,0.25)",
              background:  tab===t.id ? "rgba(201,168,76,0.12)" : "#fff",
              color:       tab===t.id ? "#8B6914" : "#7A6E5A",
              fontFamily:"Cairo,sans-serif", fontSize:13,
              fontWeight: tab===t.id ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.22 }}>

          {/* ═══ VIDEOS ═══ */}
          {tab === "videos" && (
            <div className="space-y-5">
              <div className="rounded-2xl p-6" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 2px 12px rgba(26,18,8,0.04)" }}>
                <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:17, marginBottom:14 }}>إضافة فيديو يوتيوب</h3>
                <div className="flex gap-3 flex-wrap mb-3">
                  <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="عنوان الفيديو" style={fieldInput} onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")} onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
                  <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="رابط يوتيوب" style={{ ...fieldInput, direction:"ltr" }} onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")} onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
                  <button onClick={() => { if (!videoTitle.trim()) { toast.error("أدخل عنوان الفيديو"); return; } if (!extractYouTubeId(videoUrl)) { toast.error("رابط يوتيوب غير صحيح"); return; } addVideo.mutate(); }}
                    disabled={addVideo.isPending}
                    style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#C9A84C,#8B6914)", color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
                    {addVideo.isPending ? "⏳..." : "＋ إضافة"}
                  </button>
                </div>
              </div>
              {(lecture.videos?.length ?? 0) === 0 ? <EmptyState icon="🎥" label="لا توجد فيديوهات بعد" /> : (
                <div className="space-y-3">
                  {lecture.videos?.map((v: Video, i: number) => (
                    <motion.div key={v.id} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.12)" }}>
                      <img src={`https://img.youtube.com/vi/${decodeYouTubeId(v.youtubeId)}/mqdefault.jpg`}
                        alt={v.title} className="w-20 h-14 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:14, fontWeight:600, marginBottom:2 }}>{v.title}</p>
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:11 }}>🔒 الرابط محمي</p>
                      </div>
                      <button onClick={() => deleteVideo.mutate(v.id)}
                        style={{ padding:"5px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.25)", color:"#DC2626", background:"none", fontFamily:"Cairo,sans-serif", fontSize:12, cursor:"pointer" }}>
                        حذف
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PDFs ═══ */}
          {tab === "pdfs" && (
            <div className="space-y-5">
              <div className="rounded-2xl p-6" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 2px 12px rgba(26,18,8,0.04)" }}>
                <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:17, marginBottom:14 }}>إضافة ملف PDF</h3>
                <div className="flex gap-3 flex-wrap">
                  <input value={pdfTitle} onChange={(e) => setPdfTitle(e.target.value)} placeholder="عنوان الملف" style={fieldInput} onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")} onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
                  <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="رابط الملف (Google Drive, etc.)" style={{ ...fieldInput, direction:"ltr" }} onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")} onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
                  <button onClick={() => { if (!pdfTitle.trim() || !pdfUrl.trim()) { toast.error("أدخل عنوان ورابط الملف"); return; } addPDF.mutate(); }}
                    disabled={addPDF.isPending}
                    style={{ padding:"10px 22px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#C9A84C,#8B6914)", color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
                    {addPDF.isPending ? "⏳..." : "＋ إضافة"}
                  </button>
                </div>
              </div>
              {(lecture.pdfs?.length ?? 0) === 0 ? <EmptyState icon="📄" label="لا توجد ملفات بعد" /> : (
                <div className="space-y-3">
                  {lecture.pdfs?.map((p: PDF) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.12)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:"rgba(201,168,76,0.1)" }}>📄</div>
                      <div className="flex-1">
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:14, fontWeight:600 }}>{p.title}</p>
                        <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"Cairo,sans-serif", color:"#C9A84C", fontSize:11, textDecoration:"none" }}>فتح الرابط ↗</a>
                      </div>
                      <button onClick={() => deletePDF.mutate(p.id)} style={{ padding:"5px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.25)", color:"#DC2626", background:"none", fontFamily:"Cairo,sans-serif", fontSize:12, cursor:"pointer" }}>حذف</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ QUIZZES ═══ */}
          {tab === "quizzes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:20 }}>الاختبارات</h3>
                <Link href={`/admin/quiz-builder?lectureId=${id}&type=quiz`}
                  style={{ padding:"9px 22px", borderRadius:12, background:"linear-gradient(135deg,#C9A84C,#8B6914)", color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:13, textDecoration:"none" }}>
                  ＋ اختبار جديد
                </Link>
              </div>
              {(lecture.quizzes?.length ?? 0) === 0 ? <EmptyState icon="📝" label="لا توجد اختبارات — أضف اختباراً جديداً" /> : (
                <div className="space-y-3">
                  {lecture.quizzes?.map((q: Quiz) => (
                    <div key={q.id} className="flex items-center gap-4 p-5 rounded-2xl" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.12)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:"rgba(201,168,76,0.1)" }}>📝</div>
                      <div className="flex-1">
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:14, fontWeight:600 }}>{q.title}</p>
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:12 }}>
                          {q.questions?.length ?? q._count?.questions ?? 0} سؤال
                          {q.timeLimit ? ` • ${q.timeLimit} دقيقة` : ""}
                        </p>
                      </div>
                      <button onClick={() => deleteQuiz.mutate(q.id)} style={{ padding:"5px 12px", borderRadius:8, border:"1px solid rgba(239,68,68,0.25)", color:"#DC2626", background:"none", fontFamily:"Cairo,sans-serif", fontSize:12, cursor:"pointer" }}>حذف</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ HOMEWORK ═══ */}
          {tab === "homework" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:20 }}>الواجبات</h3>
                <Link href={`/admin/quiz-builder?lectureId=${id}&type=homework`}
                  style={{ padding:"9px 22px", borderRadius:12, background:"linear-gradient(135deg,#C9A84C,#8B6914)", color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:13, textDecoration:"none" }}>
                  ＋ واجب جديد
                </Link>
              </div>
              {(lecture.homework?.length ?? 0) === 0 ? <EmptyState icon="📋" label="لا توجد واجبات" /> : (
                <div className="space-y-3">
                  {lecture.homework?.map((hw: Homework) => (
                    <div key={hw.id} className="flex items-center gap-4 p-5 rounded-2xl" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.12)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:"rgba(201,168,76,0.1)" }}>📋</div>
                      <div className="flex-1">
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:14, fontWeight:600 }}>{hw.title}</p>
                        <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:12 }}>{hw.questions?.length ?? hw._count?.questions ?? 0} سؤال</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {tab === "settings" && (
            <LectureSettings
              lectureId={id}
              lecture={lecture}
              onSave={(body) => updateSettings.mutate(body)}
              isSaving={updateSettings.isPending}
              qc={qc}
              toast={toast}
            />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Settings sub-component ────────────────────────────────
function LectureSettings({
  lectureId, lecture, onSave, isSaving, qc, toast,
}: {
  lectureId: string;
  lecture: { title: string; description?: string | null; quizRequirement: QuizRequirement; quizPassScore: number; courses?: { course: Course }[] };
  onSave: (b: { quizRequirement: QuizRequirement; quizPassScore: number }) => void;
  isSaving: boolean;
  qc: ReturnType<typeof useQueryClient>;
  toast: ReturnType<typeof useToast>;
}) {
  const [title,        setTitle]       = useState(lecture.title);
  const [description,  setDescription] = useState(lecture.description ?? "");
  const [quizReq,      setQuizReq]     = useState<QuizRequirement>(lecture.quizRequirement ?? "NONE");
  const [passScore,    setPassScore]   = useState(lecture.quizPassScore ?? 60);

  const saveText = useMutation({
    mutationFn: () => fetchWithAuth(`/api/lectures/${lectureId}`, {
      method: "PUT",
      body: JSON.stringify({ title, description, courseIds: lecture.courses?.map((c) => c.course.id) ?? [] }),
    }),
    onSuccess: (res) => {
      if (res.success) { toast.success("✅ تم تحديث المحاضرة"); qc.invalidateQueries({ queryKey: ["admin-lecture", lectureId] }); }
      else toast.error(res.error ?? "فشل");
    },
  });

  const fieldInput: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:12,
    border:"1.5px solid rgba(201,168,76,0.25)", background:"#FAFAF8",
    color:"#1A1208", fontFamily:"Cairo,sans-serif", fontSize:14,
    outline:"none", direction:"rtl", transition:"border-color 0.2s",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Text info */}
      <div className="rounded-2xl p-6" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 2px 12px rgba(26,18,8,0.04)" }}>
        <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:18, marginBottom:16 }}>معلومات المحاضرة</h3>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:"Cairo,sans-serif", color:"#4A3F2A", fontSize:13, fontWeight:600, marginBottom:5, display:"block" }}>العنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={fieldInput} onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")} onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontFamily:"Cairo,sans-serif", color:"#4A3F2A", fontSize:13, fontWeight:600, marginBottom:5, display:"block" }}>الوصف</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...fieldInput, resize:"vertical" }} onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")} onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
        </div>
        <button onClick={() => saveText.mutate()} disabled={saveText.isPending}
          style={{ padding:"11px 28px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#C9A84C,#8B6914)", color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
          {saveText.isPending ? "⏳..." : "💾 حفظ النص"}
        </button>
      </div>

      {/* Quiz requirement */}
      <div className="rounded-2xl p-6" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 2px 12px rgba(26,18,8,0.04)" }}>
        <h3 style={{ fontFamily:"Amiri,serif", color:"#1A1208", fontSize:18, marginBottom:6 }}>🔐 إعداد الاختبار الإجباري</h3>
        <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13, marginBottom:16 }}>
          حدد ما إذا كان يجب على الطالب اجتياز الاختبار قبل مشاهدة محتوى هذه المحاضرة.
        </p>

        <div className="space-y-3 mb-5">
          {REQUIREMENT_OPTIONS.map((opt) => (
            <motion.button key={opt.value} type="button" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
              onClick={() => setQuizReq(opt.value)}
              className="w-full flex items-start gap-4 p-4 rounded-xl text-right"
              style={{ border:"1.5px solid", borderColor: quizReq===opt.value ? opt.color : "rgba(201,168,76,0.2)",
                background: quizReq===opt.value ? `${opt.color}0f` : "transparent", cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${quizReq===opt.value ? opt.color : "rgba(201,168,76,0.3)"}`,
                background: quizReq===opt.value ? opt.color : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:12, flexShrink:0, marginTop:2, transition:"all 0.15s" }}>
                {quizReq===opt.value ? "✓" : ""}
              </div>
              <div>
                <p style={{ fontFamily:"Cairo,sans-serif", color:"#1A1208", fontSize:14, fontWeight:700 }}>{opt.label}</p>
                <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:12, marginTop:2 }}>{opt.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {quizReq === "MUST_PASS" && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} style={{ marginBottom:16 }}>
            <label style={{ fontFamily:"Cairo,sans-serif", color:"#4A3F2A", fontSize:13, fontWeight:600, marginBottom:5, display:"block" }}>
              درجة النجاح المطلوبة (%)
            </label>
            <div className="flex items-center gap-4">
              <input type="number" min={1} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))}
                style={{ ...fieldInput, width:120, direction:"ltr" }}
                onFocus={(e) => (e.target.style.borderColor="rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.target.style.borderColor="rgba(201,168,76,0.25)")} />
              <span style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:14 }}>%</span>
              <span style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:13 }}>
                الطالب يحتاج ≥ {passScore}% للنجاح
              </span>
            </div>
          </motion.div>
        )}

        <button onClick={() => onSave({ quizRequirement: quizReq, quizPassScore: passScore })} disabled={isSaving}
          style={{ padding:"11px 28px", borderRadius:12, border:"none",
            background: isSaving ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg,#C9A84C,#8B6914)",
            color:"#1A1208", fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
          {isSaving ? "⏳ جارٍ الحفظ..." : "💾 حفظ إعداد الاختبار"}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center py-14 rounded-2xl" style={{ background:"#fff", border:"1px solid rgba(201,168,76,0.12)" }}>
      <div style={{ fontSize:44, marginBottom:10 }}>{icon}</div>
      <p style={{ fontFamily:"Cairo,sans-serif", color:"#7A6E5A", fontSize:14 }}>{label}</p>
    </div>
  );
}
