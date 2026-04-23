"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendToDify } from "@/lib/api/dify";
import { 
  Timer, 
  History, 
  Sparkles, 
  Settings, 
  BarChart3, 
  Home as HomeIcon,
  ChevronRight,
  Calendar as CalendarIcon,
  Zap,
  CreditCard,
  User,
  LogOut,
  ArrowLeft,
  Moon,
  Sun,
  Cloud,
  Heart,
  Wind,
  Plus,
  Pen,
  Quote,
  Layers,
  Maximize2,
  Type,
  Send,
  Check,
  Stars,
  Flower,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type Tab = "home" | "history" | "insights" | "settings";

interface JournalEntry {
  id: string;
  date: string; // ISO String
  day: string;  // "09"
  dow: string;  // "Fri"
  plans: string[]; // 複数の予定
  deepDive?: {
    question: string;
    answer: string;
    planIdx: number; // どの予定に対する対話か
  }[];
  planSummaries?: string[]; // 各予定ごとのAIアンサー
  mood: string;
  conversationId?: string;
  /** 5分タイムアウトなどで未完了のまま保存したとき */
  incomplete?: boolean;
}

interface UserProfileData {
  residence: string;
  age: string;
  occupation: string;
  hobbies: string[];
}

// --- LocalStorage Helpers ---
const STORAGE_KEY = "rejournal_entries_v2"; // Version up for new schema
const USER_PROFILE_KEY = "rejournal_user_profile_v1";
const EMPTY_USER_PROFILE: UserProfileData = {
  residence: "",
  age: "",
  occupation: "",
  hobbies: [""],
};

const getUserProfile = (): UserProfileData => {
  if (typeof window === "undefined") return EMPTY_USER_PROFILE;
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return EMPTY_USER_PROFILE;

  try {
    const parsed = JSON.parse(raw) as Partial<UserProfileData>;
    return {
      residence: parsed.residence || "",
      age: parsed.age || "",
      occupation: parsed.occupation || "",
      hobbies: parsed.hobbies && parsed.hobbies.length > 0 ? parsed.hobbies : [""],
    };
  } catch {
    // 旧バージョン（文字列保存）の互換
    return {
      ...EMPTY_USER_PROFILE,
      occupation: raw,
    };
  }
};

const saveUserProfile = (profile: UserProfileData) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

const resolveUserProfileForPrompt = (profile: UserProfileData) => {
  const hobbies = profile.hobbies.map((h) => h.trim()).filter(Boolean);
  const lines = [
    `住まい: ${profile.residence.trim() || "未設定"}`,
    `年齢: ${profile.age.trim() || "未設定"}`,
    `職業: ${profile.occupation.trim() || "未設定"}`,
    `趣味: ${hobbies.length > 0 ? hobbies.join("、") : "未設定"}`,
  ];
  return lines.join("\n");
};

const saveEntry = async (
  plans: string[],
  deepDive: { question: string, answer: string, planIdx: number }[],
  userProfile: UserProfileData
) => {
  const now = new Date();
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const validPlans = plans.filter(p => p.trim());
  
  // 各予定ごとに個別のアンサーを生成（並列実行で高速化）
  const summaryPromises = validPlans.map(async (plan, idx) => {
    const history = deepDive.filter(d => d.planIdx === idx);
    const query = `
ユーザー情報: ${resolveUserProfileForPrompt(userProfile)}
予定: ${plan}
対話履歴:
${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n")}

上記の対話履歴・予定内容・ユーザー情報をすべて踏まえて、この予定に対する具体的な1日のアドバイスをタメ口でフレンドリーに返して。
以下の内容をできる限り含めること:
- 準備すべきこと・持ち物
- 時間の使い方や行動の順番
- この予定をより楽しむためのちょっとしたコツや提案
- 1日をポジティブに締めくくれるような一言
    `.trim();
    try {
      const res = await sendToDify(query, "guest_user");
      return res.answer;
    } catch (e) {
      console.error("[saveEntry] Dify summary failed", { plan, idx, error: e });
      return "楽しんできてね！準備を忘れずに。";
    }
  });

  const planSummaries = await Promise.all(summaryPromises);
  
  const newEntry: JournalEntry = {
    id: crypto.randomUUID(),
    date: now.toISOString(),
    day: now.getDate().toString().padStart(2, "0"),
    dow: dows[now.getDay()],
    plans: validPlans,
    deepDive,
    planSummaries,
    mood: "Calm"
  };

  const existing = getEntries();
  const updated = [newEntry, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

const saveIncompleteEntry = (
  plans: string[],
  deepDive: { question: string; answer: string; planIdx: number }[]
) => {
  const now = new Date();
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const validPlans = plans.filter((p) => p.trim());
  const displayPlans =
    validPlans.length > 0
      ? validPlans
      : ["（5分の制限に達し、入力が完了しませんでした）"];

  const summaryNote =
    "※ 制限時間のため途中の内容のみ保存されています。AIの締めの一文はありません。";

  const newEntry: JournalEntry = {
    id: crypto.randomUUID(),
    date: now.toISOString(),
    day: now.getDate().toString().padStart(2, "0"),
    dow: dows[now.getDay()],
    plans: displayPlans,
    deepDive: deepDive.length > 0 ? deepDive : undefined,
    planSummaries: displayPlans.map(() => summaryNote),
    mood: "Calm",
    incomplete: true,
  };

  const existing = getEntries();
  const updated = [newEntry, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

const getEntries = (): JournalEntry[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, onClear }: { activeTab: Tab, setActiveTab: (tab: Tab) => void, onClear: () => void }) => {
  const menuItems = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "history", icon: History, label: "History" },
    { id: "insights", icon: BarChart3, label: "Insights" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const navTooltipClass =
    "pointer-events-none absolute left-1/2 z-[60] w-max max-w-[140px] -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-stone-900/95 px-3 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100";

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 overflow-visible bg-white/40 backdrop-blur-2xl border border-white/20 rounded-[2rem] px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-[65] grid grid-cols-5 items-center justify-items-center w-[min(92vw,460px)]">
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={item.label}
          onClick={() => setActiveTab(item.id as Tab)}
          className={cn(
            "relative flex flex-col items-center justify-center p-2 transition-all duration-500 group outline-none",
            activeTab === item.id ? "text-stone-900 scale-110" : "text-stone-300 hover:text-stone-500"
          )}
        >
          <span className={`${navTooltipClass} bottom-[calc(100%+10px)]`} role="tooltip">
            {item.label}
          </span>
          <item.icon size={26} strokeWidth={activeTab === item.id ? 2 : 1.5} />
          {activeTab === item.id && (
            <motion.div
              layoutId="activeTabGlow"
              className="absolute inset-0 bg-stone-900/5 rounded-full -z-10 blur-md"
            />
          )}
        </button>
      ))}
      <button
        type="button"
        aria-label="Clear all journal data"
        onClick={() => {
          if (confirm("これまでの記録をすべて削除してもいい？")) {
            onClear();
          }
        }}
        className="group relative flex flex-col items-center justify-center p-2 text-stone-300 outline-none transition-colors hover:text-red-400 focus-visible:text-red-400"
      >
        <span className={`${navTooltipClass} bottom-[calc(100%+10px)]`} role="tooltip">
          Clear
        </span>
        <LogOut size={22} />
      </button>
    </nav>
  );
};

const JournalHome = ({ onStart }: { onStart: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[85vh] text-center"
  >
    <div className="relative mb-20">
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="w-56 h-56 bg-gradient-to-br from-stone-50 via-white to-stone-100 rounded-[4rem] flex items-center justify-center shadow-[0_30px_60px_rgba(0,0,0,0.02)] border border-white/50"
      >
        <div className="relative">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -top-12 -left-12"
          >
            <Cloud size={80} className="text-stone-100 blur-[2px]" />
          </motion.div>
          <Sparkles size={72} className="text-stone-900 relative z-10" />
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute -bottom-8 -right-8"
          >
            <Wind size={48} className="text-stone-50" />
          </motion.div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="absolute -bottom-6 -right-6 bg-white text-stone-900 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl border border-stone-50"
      >
        <Heart size={24} fill="currentColor" className="text-stone-900" />
      </motion.div>
    </div>

    <div className="space-y-6 mb-20">
      <h2 className="text-6xl font-serif font-extralight text-stone-900 tracking-tighter leading-[1.1]">
        心に、<br />
        <span className="italic text-stone-300">余白</span>を。
      </h2>
    </div>

    <motion.button
      onClick={onStart}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative w-24 h-24 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-stone-900 rounded-[2rem] rotate-45 group-hover:rotate-90 transition-transform duration-700 shadow-2xl" />
      <div className="relative z-10 text-white flex flex-col items-center gap-1">
        <Pen size={28} strokeWidth={1.5} />
        <span className="text-[8px] tracking-[0.3em] font-bold uppercase opacity-60">Write</span>
      </div>
      
      <motion.div
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 border border-stone-900 rounded-[2rem] rotate-45"
      />
    </motion.button>
  </motion.div>
);

type JournalFinishPayload = {
  plans: string[];
  deepDive: { question: string; answer: string; planIdx: number }[];
  incomplete?: boolean;
};

const JOURNAL_TIME_LIMIT_SEC = 300;

const JournalEditor = ({
  onFinish,
  userProfile,
}: {
  onFinish: (data: JournalFinishPayload | null) => void;
  userProfile: UserProfileData;
}) => {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<string[]>([""]);
  const [deepDive, setDeepDive] = useState<{ question: string, answer: string, planIdx: number }[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [timeLeft, setTimeLeft] = useState(JOURNAL_TIME_LIMIT_SEC);

  const snapshotRef = useRef({
    step: 1,
    plans: [""] as string[],
    deepDive: [] as { question: string; answer: string; planIdx: number }[],
    currentQuestions: [] as string[],
    currentAnswers: [] as string[],
  });
  useEffect(() => {
    snapshotRef.current = {
      step,
      plans,
      deepDive,
      currentQuestions,
      currentAnswers,
    };
  }, [step, plans, deepDive, currentQuestions, currentAnswers]);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const hasEndedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 || hasEndedRef.current) return;
    hasEndedRef.current = true;
    const s = snapshotRef.current;
    const merged: { question: string; answer: string; planIdx: number }[] = [...s.deepDive];
    s.currentQuestions.forEach((q: string, i: number) => {
      if (s.currentAnswers[i]?.trim()) {
        merged.push({ question: q, answer: s.currentAnswers[i], planIdx: i });
      }
    });
    onFinishRef.current({ plans: s.plans, deepDive: merged, incomplete: true });
  }, [timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const addPlan = () => setPlans([...plans, ""]);
  const updatePlan = (index: number, val: string) => {
    const newPlans = [...plans];
    newPlans[index] = val;
    setPlans(newPlans);
  };

  const startDeepDive = async () => {
    if (timeLeft <= 0 || hasEndedRef.current) return;
    const validPlans = plans.filter(p => p.trim());
    if (validPlans.length === 0) return;

    setIsAiLoading(true);
    try {
      const query = `
ユーザー情報: ${resolveUserProfileForPrompt(userProfile)}。
以下の各予定について、その予定をより具体的に把握するための質問を1つだけタメ口でして。
質問は予定の内容に応じて柔軟に選ぶこと（例: 誰と行くか・目的・場所・何をするか・楽しみにしていること・気になっていることなど）。特定の観点に限定しない。
回答形式: 質問1 | 質問2 | ...

予定リスト:
${validPlans.map((p, i) => `${i + 1}. ${p}`).join("\n")}
      `.trim();

      const res = await sendToDify(query, "guest_user");
      const questions = res.answer.split("|").map(q => q.trim());
      setCurrentQuestions(questions);
      setCurrentAnswers(new Array(questions.length).fill(""));
      setConversationId(res.conversation_id);
      setStep(2);
    } catch (error) {
      console.error("[JournalEditor] startDeepDive / Dify failed", error);
      setCurrentQuestions(validPlans.map(() => "その予定、どんな感じになりそう？"));
      setCurrentAnswers(new Array(validPlans.length).fill(""));
      setStep(2);
    } finally {
      setIsAiLoading(false);
    }
  };

  const nextDeepDive = async () => {
    if (timeLeft <= 0 || hasEndedRef.current) return;
    const newHistory = [...deepDive];
    currentQuestions.forEach((q, i) => {
      if (currentAnswers[i]) {
        newHistory.push({ question: q, answer: currentAnswers[i], planIdx: i });
      }
    });
    setDeepDive(newHistory);

    if (step === 3) {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      onFinish({ plans, deepDive: newHistory });
      return;
    }

    setIsAiLoading(true);
    try {
      const validPlans = plans.filter(p => p.trim());
      const query = `
ユーザー情報: ${resolveUserProfileForPrompt(userProfile)}。
以下の各予定と、これまでの対話履歴を踏まえて、予定をさらに深掘りする質問を1つだけタメ口でして。
すでに聞いた内容は重複しないこと。時間・場所・気持ち・目的・準備・一緒に行く人など、予定ごとに最も自然な観点で質問すること。
回答形式: 質問1 | 質問2 | ...

${validPlans.map((p, i) => {
  const history = newHistory.filter(d => d.planIdx === i);
  return `予定${i + 1}: ${p}\n対話履歴:\n${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n")}`;
}).join("\n\n")}
      `.trim();

      const res = await sendToDify(query, "guest_user", conversationId);
      const nextQuestions = res.answer.split("|").map(q => q.trim());
      setCurrentQuestions(nextQuestions);
      setCurrentAnswers(new Array(nextQuestions.length).fill(""));
      setStep(step + 1);
    } catch (error) {
      console.error("[JournalEditor] nextDeepDive / Dify failed", error);
      setCurrentQuestions(currentQuestions.map(() => "それについて、もう少し教えて？"));
      setCurrentAnswers(new Array(currentQuestions.length).fill(""));
      setStep(step + 1);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#FDFCFB] z-[60] flex flex-col overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[15%] -left-[10%] w-[80%] h-[80%] bg-[#FFF5F0] rounded-full blur-[140px] opacity-70" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[15%] -right-[10%] w-[70%] h-[70%] bg-[#F0F4FF] rounded-full blur-[120px] opacity-50" 
        />
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-12 relative z-10">
        <header className="py-12 flex justify-between items-center">
            <div className="flex flex-col">
            <span className="text-[9px] tracking-[0.6em] uppercase text-stone-400 font-bold mb-2">Mind Mapping</span>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "text-4xl font-light font-mono tracking-tighter transition-colors duration-300",
                  timeLeft <= 10
                    ? "text-red-600"
                    : timeLeft <= 60
                      ? "text-amber-700"
                      : "text-stone-800"
                )}
              >
                {formatTime(timeLeft)}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                    step === i ? "bg-stone-800 w-4" : "bg-stone-200"
                  )} />
                ))}
            </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hasEndedRef.current = true;
              onFinish(null);
            }}
            className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-800 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
        </header>

        <main className="flex-1 flex flex-col relative py-4 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-stone-300 font-bold mb-4">Step 1</p>
                  <h3 className="text-3xl font-serif text-stone-800 mb-2">What's on your mind?</h3>
                  <p className="text-stone-400 text-sm italic">今日（または明日）の予定や、考えていることを教えてください。</p>
                </div>
                <div className="space-y-4">
                  {plans.map((plan, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                      <input
                        value={plan}
                        onChange={(e) => updatePlan(i, e.target.value)}
                        placeholder={i === 0 ? "例: 病院に行く" : "他にもあれば..."}
                        className="w-full bg-white/40 backdrop-blur-sm border border-stone-200/50 rounded-2xl p-6 text-xl font-serif text-stone-800 placeholder-stone-200 outline-none focus:border-stone-300 transition-all"
                      />
                    </motion.div>
                  ))}
                  <button onClick={addPlan} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors pl-2">
                    <Plus size={16} />
                    <span className="text-[10px] tracking-widest uppercase font-bold">Add another</span>
                  </button>
                </div>
              </motion.div>
            )}

            {(step === 2 || step === 3) && (
              <motion.div key={`step${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-stone-300 font-bold mb-4">Step {step}: {step === 2 ? "Deep Dive" : "Further Exploration"}</p>
                  <h3 className="text-2xl font-serif text-stone-600 italic leading-relaxed">
                    {isAiLoading ? "AIが思考を深めています..." : "もう少し詳しく教えてください。"}
                  </h3>
                </div>
                <div className="space-y-12">
                  {!isAiLoading && currentQuestions.map((q, i) => (
                    <div key={i} className="space-y-4 relative">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <p className="text-[10px] tracking-widest uppercase text-stone-400 font-bold">
                          Regarding: {plans.filter(p => p.trim())[i]}
                        </p>
                      </div>
                      <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 relative overflow-hidden group transition-all hover:border-stone-200">
                        <div className="absolute top-0 left-0 w-1 h-full bg-stone-200 group-hover:bg-stone-400 transition-colors" />
                        <p className="text-sm font-serif text-stone-600 leading-relaxed italic">{q}</p>
                      </div>
          <textarea
                        value={currentAnswers[i] || ""}
                        onChange={(e) => {
                          const newAns = [...currentAnswers];
                          newAns[i] = e.target.value;
                          setCurrentAnswers(newAns);
                        }}
                        placeholder="回答を入力..."
                        className="w-full h-32 bg-white/40 backdrop-blur-sm border border-stone-200/50 rounded-[1.5rem] p-6 text-lg font-serif text-stone-800 placeholder-stone-200 outline-none focus:border-stone-300 transition-all resize-none shadow-inner"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-stone-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Check size={32} />
                  </div>
                  <h3 className="text-3xl font-serif text-stone-800">Your thoughts are clear.</h3>
                  <p className="text-stone-400 italic mt-2 text-sm">対話を通じて、今日の大切なことが見えてきたよ。</p>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-10 border border-stone-100 shadow-sm space-y-12">
                  {plans.filter(p => p.trim()).map((plan, planIdx) => (
                    <div key={planIdx} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                          {planIdx + 1}
                        </div>
                        <h4 className="text-xl font-serif text-stone-800">{plan}</h4>
                      </div>
                      
                      <div className="space-y-4 border-l-2 border-stone-50 ml-4 pl-8">
                        {deepDive.filter(d => d.planIdx === planIdx).map((d, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-[10px] text-stone-300 uppercase tracking-widest font-bold">Q: {d.question}</p>
                            <p className="text-stone-600 font-serif">{d.answer}</p>
                          </div>
                        ))}
                        
                        {/* 各予定ごとのAIアンサー（保存後に表示されるように調整が必要なため、ここではプレースホルダー） */}
                        <div className="mt-6 bg-stone-50 p-6 rounded-2xl border border-stone-100 italic text-stone-500 text-sm">
                          <Sparkles size={14} className="mb-2 text-stone-400" />
                          AIがこの予定のアドバイスをまとめているよ...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-12 flex justify-end">
          {isAiLoading ? (
            <div className="w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-2 border-stone-100 border-t-stone-900 rounded-full"
              />
            </div>
          ) : (
            <>
              {step === 1 && (
                <motion.button
                  type="button"
                  onClick={startDeepDive}
                  disabled={!plans[0]?.trim() || timeLeft <= 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "group relative w-20 h-20 flex items-center justify-center",
                    (!plans[0]?.trim() || timeLeft <= 0) && "opacity-20"
                  )}
                >
                  <div className="absolute inset-0 bg-stone-900 rounded-2xl rotate-45 group-hover:rotate-90 transition-transform duration-700 shadow-xl" />
                  <div className="relative z-10 text-white flex flex-col items-center gap-1">
                    <ArrowRight size={24} />
                    <span className="text-[7px] tracking-widest uppercase font-bold">Next</span>
                  </div>
                </motion.button>
              )}
              {(step === 2 || step === 3) && (
                <motion.button
                  type="button"
                  onClick={nextDeepDive}
                  disabled={currentAnswers.every((a) => !a) || timeLeft <= 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "group relative w-20 h-20 flex items-center justify-center",
                    (currentAnswers.every((a) => !a) || timeLeft <= 0) && "opacity-20"
                  )}
                >
                  <div className="absolute inset-0 bg-stone-900 rounded-2xl rotate-45 group-hover:rotate-90 transition-transform duration-700 shadow-xl" />
                  <div className="relative z-10 text-white flex flex-col items-center gap-1">
                    <ArrowRight size={24} />
                    <span className="text-[7px] tracking-widest uppercase font-bold">
                      {step === 3 ? "Finish" : "Next"}
                    </span>
                  </div>
                </motion.button>
              )}
            </>
          )}
        </footer>
      </div>

      {/* 結果画面表示後のクローズボタン（Finish後に表示） */}
      {step === 4 && (
        <div className="absolute top-8 right-8 z-[70]">
          <button 
            onClick={() => {
              // エディタを完全に閉じてホームへ
              window.dispatchEvent(new CustomEvent('close-editor'));
            }}
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-lg border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all"
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const HistoryView = ({ entries }: { entries: JournalEntry[] }) => {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  return (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-12 pb-40 pt-8"
  >
    <div className="flex justify-between items-baseline">
      <h2 className="text-4xl font-serif font-light text-stone-900">History</h2>
      <span className="text-stone-300 text-xs font-mono tracking-widest uppercase">
        {entries.length > 0 ? "Your Journey" : "No Records Yet"}
      </span>
    </div>

      <div className="grid gap-10">
      {entries.length > 0 ? (
        entries.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ x: 10 }}
              onClick={() => setSelectedEntry(item)}
              className="group flex gap-8 items-center cursor-pointer"
            >
              <div className="flex flex-col items-center w-16 h-16 bg-stone-50 rounded-full flex-shrink-0 justify-center group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-sm">
                <span className="text-[8px] font-bold tracking-tighter opacity-50 mb-0.5 uppercase">{item.dow}</span>
                <span className="text-xl font-serif leading-none">{item.day}</span>
              </div>
            <div className="flex-1 border-b border-stone-100 pt-6 pb-4 group-last:border-none flex items-center gap-3 min-w-0">
              <h3 className="text-lg font-serif font-medium text-stone-800 group-hover:text-stone-500 transition-colors line-clamp-1 min-w-0">
                {item.plans && item.plans.length > 0 ? item.plans[0] : "No Title"}
              </h3>
              {item.incomplete ? (
                <span className="flex-shrink-0 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                  時間切れ
                </span>
              ) : null}
            </div>
          </motion.div>
        ))
      ) : (
        <div className="py-20 text-center space-y-4 opacity-20">
          <Cloud size={48} className="mx-auto" />
          <p className="text-sm font-serif italic">まだ物語は始まっていません。</p>
        </div>
      )}
      </div>

      {/* Entry Detail Overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#FDFCFB]/80 backdrop-blur-xl z-[70] flex items-center justify-center p-8"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-stone-100 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="p-10 pt-16 space-y-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
                {selectedEntry.incomplete ? (
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 leading-relaxed">
                    5分の制限時間内に完了しなかったため、途中の内容だけを保存しています。
                  </div>
                ) : null}
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center w-14 h-14 bg-stone-900 text-white rounded-2xl justify-center shadow-lg">
                    <span className="text-[7px] font-bold tracking-widest uppercase opacity-60 mb-0.5">{selectedEntry.dow}</span>
                    <span className="text-lg font-serif leading-none">{selectedEntry.day}</span>
                  </div>
                  <div>
                    <h4 className="text-[10px] tracking-[0.4em] uppercase text-stone-300 font-bold mb-1">Journal Entry</h4>
                    <p className="text-stone-500 font-serif italic text-sm">
                      {new Date(selectedEntry.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-12 max-h-[80vh] overflow-y-auto scrollbar-hide">
                  {selectedEntry.plans.map((plan, planIdx) => (
                    <div key={planIdx} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                          {planIdx + 1}
                        </div>
                        <h4 className="text-xl font-serif text-stone-800">{plan}</h4>
                      </div>
                      
                      <div className="space-y-4 border-l-2 border-stone-50 ml-4 pl-8">
                        {selectedEntry.deepDive
                          ?.filter(d => d.planIdx === planIdx)
                          .map((d, i) => (
                            <div key={i} className="space-y-1">
                              <p className="text-[10px] text-stone-300 uppercase tracking-widest font-bold">Q: {d.question}</p>
                              <p className="text-stone-600 font-serif">{d.answer}</p>
                            </div>
                          ))}
                        
                        {selectedEntry.planSummaries?.[planIdx] && (
                          <div className="mt-6 bg-stone-50 p-6 rounded-2xl border border-stone-100 italic text-stone-600 text-sm leading-relaxed">
                            <Sparkles size={14} className="mb-2 text-stone-400" />
                            "{selectedEntry.planSummaries[planIdx]}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
      </div>
    </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  </motion.div>
);
};

const InsightsActivityChart = ({
  entries,
  scores,
  maxScore,
}: {
  entries: JournalEntry[];
  scores: number[];
  maxScore: number;
}) => {
  const VB_W = 360;
  const VB_H = 152;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 40;
  const chartW = VB_W - padL - padR;
  const chartH = VB_H - padT - padB;
  const n = entries.length;
  const yBase = padT + chartH;

  const pts = scores.map((s, i) => {
    const x = padL + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    const y = padT + chartH * (1 - s / maxScore);
    return { x, y, s, item: entries[i] };
  });

  const lineD =
    pts.length > 1
      ? `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`
      : pts.length === 1
        ? `M ${pts[0].x - 18} ${pts[0].y} L ${pts[0].x + 18} ${pts[0].y}`
        : "";

  const areaD =
    pts.length > 0
      ? `M ${pts[0].x} ${yBase} L ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${pts[pts.length - 1].x} ${yBase} Z`
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full max-h-[200px] overflow-visible"
        role="img"
        aria-label="直近の記録ごとの活動スコアの折れ線グラフ"
      >
        <defs>
          <linearGradient id="insightsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="insightsBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t, i) => {
          const y = padT + chartH * (1 - t);
          return (
            <line
              key={i}
              x1={padL}
              y1={y}
              x2={padL + chartW}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray={i === 2 ? "0" : "4 6"}
              strokeWidth={1}
            />
          );
        })}

        <text x={4} y={padT + 4} fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="ui-monospace, monospace">
          {maxScore}
        </text>
        <text
          x={4}
          y={padT + chartH / 2 + 3}
          fill="rgba(255,255,255,0.28)"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
        >
          {Math.round(maxScore / 2)}
        </text>
        <text x={4} y={yBase + 3} fill="rgba(255,255,255,0.28)" fontSize="9" fontFamily="ui-monospace, monospace">
          0
        </text>

        {pts.map((p) => {
          const barW = Math.min(14, chartW / Math.max(n * 1.8, 4));
          return (
            <rect
              key={`bar-${p.item.id}`}
              x={p.x - barW / 2}
              y={p.y}
              width={barW}
              height={Math.max(0, yBase - p.y)}
              rx={3}
              fill="url(#insightsBar)"
              opacity={0.85}
            />
          );
        })}

        {areaD ? <path d={areaD} fill="url(#insightsArea)" /> : null}

        {lineD ? (
          <motion.path
            d={lineD}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}

        {pts.map((p) => {
          const plans = p.item.plans?.filter((x) => x.trim()).length ?? 0;
          const dives = p.item.deepDive?.length ?? 0;
          const dateStr = new Date(p.item.date).toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
          });
          const tip = `${dateStr} · スコア ${p.s}（予定 ${plans}・対話 ${dives}）`;
          return (
            <g key={p.item.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={5}
                fill="rgb(28 25 23)"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={1.5}
              >
                <title>{tip}</title>
              </circle>
              <text
                x={p.x}
                y={yBase + 14}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="8"
                fontFamily="ui-monospace, monospace"
                letterSpacing="0.02em"
              >
                {p.item.dow}
              </text>
              <text
                x={p.x}
                y={yBase + 26}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize="11"
                fontFamily="ui-serif, Georgia, serif"
              >
                {p.item.day}
              </text>
              <text
                x={p.x}
                y={yBase + 38}
                textAnchor="middle"
                fill="rgba(255,255,255,0.35)"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
              >
                {p.s}
              </text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
};

const InsightsView = ({ entries }: { entries: JournalEntry[] }) => {
  const total = entries.length;
  const latest = total > 0 ? entries[0] : null;
  const recentChrono = [...entries].slice(0, 7).reverse();

  const activityScore = (e: JournalEntry) =>
    (e.plans?.filter((p) => p.trim()).length ?? 0) + (e.deepDive?.length ?? 0);

  const scores = recentChrono.map(activityScore);
  const maxScore = Math.max(1, ...scores);

  const gentleDip = (() => {
    if (latest?.incomplete || scores.length < 2) return false;
    const newest = scores[scores.length - 1];
    const prev = scores.slice(0, -1);
    const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
    const newestPlans =
      recentChrono[recentChrono.length - 1]?.plans?.filter((p) => p.trim()).length ?? 0;
    const prevPlanAvgs = recentChrono
      .slice(0, -1)
      .map((e) => e.plans?.filter((p) => p.trim()).length ?? 0);
    const prevPlanAvg =
      prevPlanAvgs.length > 0
        ? prevPlanAvgs.reduce((a, b) => a + b, 0) / prevPlanAvgs.length
        : 0;
    const scoreDip = newest + 1e-6 < prevAvg;
    const planDip =
      prevPlanAvgs.length > 0 && newestPlans + 1e-6 < prevPlanAvg;
    return scoreDip || planDip;
  })();

  const rhythmTitle = gentleDip ? "いまは、ゆとりのフェーズ" : "直近の手応え";

  const latestLead =
    latest?.incomplete
      ? (latest.plans.map((p) => p.trim()).find((p) => p && !p.startsWith("（")) ?? "")
      : (latest?.plans?.map((p) => p.trim()).find(Boolean) ?? "");
  const focusPreview =
    latestLead.length > 0
      ? latestLead.length > 40
        ? `${latestLead.slice(0, 40)}…`
        : latestLead
      : total > 0 && latest?.incomplete
        ? "時間切れで保存された記録"
        : total > 0
          ? "（予定テキストなし）"
          : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-40 pt-8"
    >
      <h2 className="text-4xl font-serif font-light text-stone-900">Insights</h2>

      <div className="relative min-h-[20rem] bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 rounded-[3rem] overflow-hidden p-8 sm:p-10 shadow-2xl ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.1),transparent_55%)] pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-[0.06] pointer-events-none">
          <Sparkles size={120} className="text-white" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-stone-500 text-[10px] tracking-[0.3em] uppercase font-bold">
              Activity
            </p>
            <p className="text-xl sm:text-2xl font-serif text-white/95 font-light tracking-tight leading-snug">
              {rhythmTitle}
            </p>
          </div>

          {total === 0 ? (
            <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.04]">
              <BarChart3 className="mb-3 text-white/20" size={36} strokeWidth={1} />
              <p className="text-sm text-stone-400 font-serif">記録があるとグラフが表示されます</p>
            </div>
          ) : (
            <InsightsActivityChart entries={recentChrono} scores={scores} maxScore={maxScore} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-8 bg-white border border-stone-100 rounded-[2.5rem] space-y-4 shadow-sm">
          <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800">
            <Zap size={20} />
          </div>
          <div>
            <p className="tracking-widest uppercase mb-1 leading-tight">
              <span className="text-stone-500 text-[11px] font-bold">Total</span>
              <br />
              <span className="text-stone-300 text-[9px]">累計ジャーナル数</span>
            </p>
            <p className="text-3xl font-serif text-stone-800">{total.toString().padStart(2, "0")}</p>
          </div>
        </div>
        <div className="p-8 bg-white border border-stone-100 rounded-[2.5rem] space-y-4 shadow-sm">
          <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800">
            <Cloud size={20} />
          </div>
          <div>
            <p className="tracking-widest uppercase mb-1 leading-tight">
              <span className="text-stone-500 text-[11px] font-bold">Latest</span>
              <br />
              <span className="text-stone-300 text-[9px]">最新の先頭の予定</span>
            </p>
            <p className="text-lg font-serif text-stone-800 leading-snug line-clamp-2">{focusPreview}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsView = ({
  userProfile,
  onChangeUserProfile,
}: {
  userProfile: UserProfileData;
  onChangeUserProfile: (next: UserProfileData) => void;
}) => {
  const updateField = (field: keyof Omit<UserProfileData, "hobbies">, value: string) => {
    onChangeUserProfile({ ...userProfile, [field]: value });
  };

  const updateHobby = (index: number, value: string) => {
    const nextHobbies = [...userProfile.hobbies];
    nextHobbies[index] = value;
    onChangeUserProfile({ ...userProfile, hobbies: nextHobbies });
  };

  const addHobby = () => {
    onChangeUserProfile({ ...userProfile, hobbies: [...userProfile.hobbies, ""] });
  };

  const removeHobby = (index: number) => {
    const filtered = userProfile.hobbies.filter((_, i) => i !== index);
    onChangeUserProfile({
      ...userProfile,
      hobbies: filtered.length > 0 ? filtered : [""],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-40 pt-8"
    >
      <h2 className="text-4xl font-serif font-light text-stone-900">Settings</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-stone-100 rounded-[2rem] flex items-center justify-center text-stone-300 shadow-inner">
            <User size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-light text-stone-800">User Profile</h3>
            <p className="text-xs text-stone-400 font-mono tracking-widest uppercase">Local Settings</p>
          </div>
        </div>
        <p className="text-sm text-stone-500 leading-relaxed">
          User Profileを設定すると、AIの精度が上がります。
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs tracking-widest uppercase text-stone-400 font-bold">住まい</label>
            <input
              value={userProfile.residence}
              onChange={(e) => updateField("residence", e.target.value)}
              placeholder="例: 東京都世田谷区"
              className="w-full bg-white/60 backdrop-blur-sm border border-stone-200/50 rounded-2xl p-4 text-base font-serif text-stone-800 placeholder-stone-300 outline-none focus:border-stone-300 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs tracking-widest uppercase text-stone-400 font-bold">年齢</label>
            <input
              value={userProfile.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="例: 29"
              className="w-full bg-white/60 backdrop-blur-sm border border-stone-200/50 rounded-2xl p-4 text-base font-serif text-stone-800 placeholder-stone-300 outline-none focus:border-stone-300 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs tracking-widest uppercase text-stone-400 font-bold">職業</label>
            <input
              value={userProfile.occupation}
              onChange={(e) => updateField("occupation", e.target.value)}
              placeholder="例: Webエンジニア"
              className="w-full bg-white/60 backdrop-blur-sm border border-stone-200/50 rounded-2xl p-4 text-base font-serif text-stone-800 placeholder-stone-300 outline-none focus:border-stone-300 transition-all"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs tracking-widest uppercase text-stone-400 font-bold">趣味</label>
              <button
                type="button"
                onClick={addHobby}
                className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors"
              >
                + Add Hobby
              </button>
            </div>
            <div className="space-y-3">
              {userProfile.hobbies.map((hobby, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    value={hobby}
                    onChange={(e) => updateHobby(i, e.target.value)}
                    placeholder={`趣味 ${i + 1}`}
                    className="flex-1 bg-white/60 backdrop-blur-sm border border-stone-200/50 rounded-2xl p-4 text-base font-serif text-stone-800 placeholder-stone-300 outline-none focus:border-stone-300 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeHobby(i)}
                    className="w-10 h-10 rounded-full bg-stone-50 border border-stone-100 text-stone-400 hover:text-red-400 transition-colors flex items-center justify-center"
                    aria-label={`remove-hobby-${i + 1}`}
                  >
                    <Plus size={16} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Page ---

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isWriting, setIsWriting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showLatestEntry, setShowLatestEntry] = useState<JournalEntry | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>(EMPTY_USER_PROFILE);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    setEntries(getEntries());
    setUserProfile(getUserProfile());
    setProfileReady(true);

    const handleClose = () => {
      setIsWriting(false);
      setActiveTab("home");
    };
    window.addEventListener('close-editor', handleClose);
    return () => window.removeEventListener('close-editor', handleClose);
  }, []);

  useEffect(() => {
    if (!profileReady) return;
    saveUserProfile(userProfile);
  }, [userProfile, profileReady]);

  const handleFinishWriting = async (data: JournalFinishPayload | null) => {
    if (!data) {
      setIsWriting(false);
      return;
    }
    if (data.incomplete) {
      const updated = saveIncompleteEntry(data.plans, data.deepDive);
      setEntries(updated);
      setIsWriting(false);
      setShowLatestEntry(updated[0]);
      return;
    }
    const updated = await saveEntry(data.plans, data.deepDive, userProfile);
    setEntries(updated);
    setIsWriting(false);
    setShowLatestEntry(updated[0]);
  };

  const handleClearData = () => {
    if (isWriting) setIsWriting(false);
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    alert("データをすべて削除したよ。");
  };

  /** ジャーナル執筆中でもメニューが使えるよう、先に執筆を中止（未保存）してからタブを切り替える */
  const requestTabChange = (tab: Tab) => {
    if (isWriting) setIsWriting(false);
    setActiveTab(tab);
  };

  return (
    <>
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-stone-900 selection:bg-stone-100 relative overflow-hidden">
      {/* 全画面共通のアンビエント背景 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-[#FFF5F0] rounded-full blur-[120px] opacity-40" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, -50, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-[#F0F4FF] rounded-full blur-[100px] opacity-30" 
        />
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/natural-paper.png")` }} />
      </div>

      <div className="max-w-md mx-auto px-8 min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <JournalHome key="home" onStart={() => setIsWriting(true)} />
          )}
          {activeTab === "history" && <HistoryView key="history" entries={entries} />}
          {activeTab === "insights" && <InsightsView key="insights" entries={entries} />}
          {activeTab === "settings" && (
            <SettingsView
              key="settings"
              userProfile={userProfile}
              onChangeUserProfile={setUserProfile}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isWriting && (
            <JournalEditor key="editor" onFinish={handleFinishWriting} userProfile={userProfile} />
          )}
        </AnimatePresence>

        {/* 執筆直後の結果表示モーダル */}
        <AnimatePresence>
          {showLatestEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#FDFCFB]/80 backdrop-blur-xl z-[70] flex items-center justify-center p-8"
              onClick={() => {
                setShowLatestEntry(null);
                setActiveTab("home");
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-stone-100 overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 p-8">
                  <button 
                    onClick={() => {
                      setShowLatestEntry(null);
                      setActiveTab("home");
                    }}
                    className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <div className="p-10 pt-16 space-y-10 max-h-[80vh] overflow-y-auto scrollbar-hide">
                  {showLatestEntry.incomplete ? (
                    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 leading-relaxed">
                      5分の制限時間内に完了しなかったため、途中の内容だけを保存しています。
                    </div>
                  ) : null}
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center w-14 h-14 bg-stone-900 text-white rounded-2xl justify-center shadow-lg">
                      <span className="text-[7px] font-bold tracking-widest uppercase opacity-60 mb-0.5">{showLatestEntry.dow}</span>
                      <span className="text-lg font-serif leading-none">{showLatestEntry.day}</span>
                    </div>
                    <div>
                      <h4 className="text-[10px] tracking-[0.4em] uppercase text-stone-300 font-bold mb-1">Journal Entry</h4>
                      <p className="text-stone-500 font-serif italic text-sm">
                        {new Date(showLatestEntry.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {showLatestEntry.plans.map((plan, planIdx) => (
                      <div key={planIdx} className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                            {planIdx + 1}
                          </div>
                          <h4 className="text-xl font-serif text-stone-800">{plan}</h4>
                        </div>
                        
                        <div className="space-y-4 border-l-2 border-stone-50 ml-4 pl-8">
                          {showLatestEntry.deepDive
                            ?.filter(d => d.planIdx === planIdx)
                            .map((d, i) => (
                              <div key={i} className="space-y-1">
                                <p className="text-[10px] text-stone-300 uppercase tracking-widest font-bold">Q: {d.question}</p>
                                <p className="text-stone-600 font-serif">{d.answer}</p>
                              </div>
                            ))}
                          
                          {showLatestEntry.planSummaries?.[planIdx] && (
                            <div className="mt-6 bg-stone-50 p-6 rounded-2xl border border-stone-100 italic text-stone-600 text-sm leading-relaxed">
                              <Sparkles size={14} className="mb-2 text-stone-400" />
                              "{showLatestEntry.planSummaries[planIdx]}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    <Sidebar activeTab={activeTab} setActiveTab={requestTabChange} onClear={handleClearData} />
    </>
  );
}
