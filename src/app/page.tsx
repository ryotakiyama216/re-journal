"use client";

import React, { useState, useEffect } from "react";
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
}

// --- LocalStorage Helpers ---
const STORAGE_KEY = "rejournal_entries_v2"; // Version up for new schema

const saveEntry = async (plans: string[], deepDive: { question: string, answer: string, planIdx: number }[]) => {
  const now = new Date();
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const validPlans = plans.filter(p => p.trim());
  
  // 各予定ごとに個別のアンサーを生成（並列実行で高速化）
  const summaryPromises = validPlans.map(async (plan, idx) => {
    const history = deepDive.filter(d => d.planIdx === idx);
    const query = `
ユーザー情報: 東京在住、エンジニア、趣味はカフェ巡り。
予定: ${plan}
対話履歴:
${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n")}

上記を踏まえ、この予定に対する具体的な出発時間や準備のアドバイスを1文で返して。
タメ口でフレンドリーに。
    `.trim();
    try {
      const res = await sendToDify(query, "guest_user");
      return res.answer;
    } catch (e) {
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

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/40 backdrop-blur-2xl border border-white/20 rounded-[2rem] px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-50 flex items-center gap-10">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as Tab)}
          className={cn(
            "relative p-2 transition-all duration-500 group",
            activeTab === item.id ? "text-stone-900 scale-110" : "text-stone-300 hover:text-stone-500"
          )}
        >
          <item.icon size={26} strokeWidth={activeTab === item.id ? 2 : 1.5} />
          {activeTab === item.id && (
            <motion.div
              layoutId="activeTabGlow"
              className="absolute inset-0 bg-stone-900/5 rounded-full -z-10 blur-md"
            />
          )}
        </button>
      ))}
      <div className="w-[1px] h-6 bg-stone-200/50 mx-2" />
      <button
        onClick={() => {
          if (confirm("これまでの記録をすべて削除してもいい？")) {
            onClear();
          }
        }}
        className="p-2 text-stone-300 hover:text-red-400 transition-colors"
        title="Clear Data"
      >
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

const JournalEditor = ({ onFinish }: { onFinish: (data: { plans: string[], deepDive: { question: string, answer: string, planIdx: number }[] } | null) => void }) => {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<string[]>([""]);
  const [deepDive, setDeepDive] = useState<{ question: string, answer: string, planIdx: number }[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const addPlan = () => setPlans([...plans, ""]);
  const updatePlan = (index: number, val: string) => {
    const newPlans = [...plans];
    newPlans[index] = val;
    setPlans(newPlans);
  };

  const startDeepDive = async () => {
    const validPlans = plans.filter(p => p.trim());
    if (validPlans.length === 0) return;

    setIsAiLoading(true);
    try {
      const query = `
ユーザー情報: 東京在住、エンジニア。
以下の各予定について、具体的な「移動手段」を1つだけタメ口で質問して。
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
      console.error(error);
      setCurrentQuestions(validPlans.map(() => "そこへはどうやって行く？"));
      setCurrentAnswers(new Array(validPlans.length).fill(""));
      setStep(2);
    } finally {
      setIsAiLoading(false);
    }
  };

  const nextDeepDive = async () => {
    const newHistory = [...deepDive];
    currentQuestions.forEach((q, i) => {
      if (currentAnswers[i]) {
        newHistory.push({ question: q, answer: currentAnswers[i], planIdx: i });
      }
    });
    setDeepDive(newHistory);

    if (step === 3) {
      // Step 3の回答を保存した直後にFinish処理へ
      onFinish({ plans, deepDive: newHistory });
      return;
    }

    setIsAiLoading(true);
    try {
      const query = `
これまでの情報を踏まえ、次は「所要時間」か「出発時間」を1つだけタメ口で質問して。
回答形式: 質問1 | 質問2 | ...

これまでの回答:
${currentAnswers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
      `.trim();

      const res = await sendToDify(query, "guest_user", conversationId);
      const nextQuestions = res.answer.split("|").map(q => q.trim());
      setCurrentQuestions(nextQuestions);
      setCurrentAnswers(new Array(nextQuestions.length).fill(""));
      setStep(step + 1);
    } catch (error) {
      console.error(error);
      setCurrentQuestions(currentQuestions.map(() => "何時ごろに出発する予定？"));
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
              <span className="text-4xl font-light font-mono text-stone-800 tracking-tighter">
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
          <button onClick={() => onFinish(null)} className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-800 shadow-sm">
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
                  onClick={startDeepDive}
                  disabled={!plans[0]}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "group relative w-20 h-20 flex items-center justify-center",
                    (!plans[0]) && "opacity-20"
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
                  onClick={nextDeepDive}
                  disabled={currentAnswers.every(a => !a)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "group relative w-20 h-20 flex items-center justify-center",
                    (currentAnswers.every(a => !a)) && "opacity-20"
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
            <div className="flex-1 border-b border-stone-100 pt-6 pb-4 group-last:border-none flex items-center">
              <h3 className="text-lg font-serif font-medium text-stone-800 group-hover:text-stone-500 transition-colors line-clamp-1">
                {item.plans && item.plans.length > 0 ? item.plans[0] : "No Title"}
              </h3>
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

const InsightsView = ({ entries }: { entries: JournalEntry[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-12 pb-40 pt-8"
  >
    <h2 className="text-4xl font-serif font-light text-stone-900">Insights</h2>
    
    <div className="relative h-80 bg-stone-900 rounded-[3rem] overflow-hidden p-10 flex flex-col justify-between shadow-2xl">
      <div className="absolute top-0 right-0 p-12 opacity-10">
        <Sparkles size={160} />
      </div>
      
      <div className="space-y-2 relative z-10">
        <p className="text-stone-500 text-[10px] tracking-[0.3em] uppercase font-bold">Mental State</p>
        <h3 className="text-4xl font-serif text-white font-light">
          {entries.length > 0 ? "穏やかな凪" : "静寂"}
        </h3>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-end gap-3 h-24">
          {entries.slice(0, 7).reverse().map((item, i) => (
            <div key={item.id} className="flex-1 flex flex-col items-center gap-3">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${40 + (i * 10)}%` }} 
                transition={{ delay: i * 0.1, duration: 1 }}
                className="w-full bg-white/20 rounded-full hover:bg-white/40 transition-colors cursor-help"
              />
              <div className="flex flex-col items-center opacity-40">
                <span className="text-[8px] font-mono text-white uppercase">{item.dow}</span>
                <span className="text-[10px] font-serif text-white">{item.day}</span>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="w-full h-full flex items-center justify-center opacity-10">
              <p className="text-xs text-white tracking-[0.5em]">NO DATA</p>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div className="p-8 bg-white border border-stone-100 rounded-[2.5rem] space-y-4 shadow-sm">
        <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800">
          <Zap size={20} />
        </div>
        <div>
          <p className="tracking-widest uppercase mb-1 leading-tight">
            <span className="text-stone-500 text-[11px] font-bold">Journey</span>
            <br />
            <span className="text-stone-300 text-[9px]">累計投稿数</span>
          </p>
          <p className="text-3xl font-serif text-stone-800">{entries.length.toString().padStart(2, "0")}</p>
        </div>
      </div>
      <div className="p-8 bg-white border border-stone-100 rounded-[2.5rem] space-y-4 shadow-sm">
        <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800">
          <Cloud size={20} />
        </div>
        <div>
          <p className="tracking-widest uppercase mb-1 leading-tight">
            <span className="text-stone-500 text-[11px] font-bold">Focus</span>
            <br />
            <span className="text-stone-300 text-[9px]">現在のテーマ</span>
          </p>
          <p className="text-3xl font-serif text-stone-800">{entries.length > 0 ? "Self" : "--"}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const SettingsView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-12 pb-40 pt-8"
  >
    <h2 className="text-4xl font-serif font-light text-stone-900">Settings</h2>

    <div className="space-y-10">
      <div className="flex items-center gap-8">
        <div className="w-24 h-24 bg-stone-100 rounded-[2rem] flex items-center justify-center text-stone-300 shadow-inner">
          <User size={40} />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-serif font-light text-stone-800">Guest User</h3>
          <p className="text-xs text-stone-400 font-mono tracking-widest uppercase">Standard Member</p>
        </div>
      </div>

      <div className="grid gap-4">
        {[
          { icon: CreditCard, label: "Subscription", detail: "Manage Plan" },
          { icon: Moon, label: "Appearance", detail: "Light Mode" },
          { icon: LogOut, label: "Sign Out", detail: "", color: "text-red-400" },
        ].map((item, i) => (
          <button key={i} className="w-full group flex items-center justify-between p-2">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-sm">
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-medium", item.color || "text-stone-800")}>{item.label}</p>
                {item.detail && <p className="text-[10px] text-stone-300 uppercase tracking-widest">{item.detail}</p>}
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-200 group-hover:translate-x-2 transition-transform duration-500" />
          </button>
        ))}
      </div>
    </div>
  </motion.div>
);

// --- Main Page ---

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isWriting, setIsWriting] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showLatestEntry, setShowLatestEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    setEntries(getEntries());

    const handleClose = () => {
      setIsWriting(false);
      setActiveTab("home");
    };
    window.addEventListener('close-editor', handleClose);
    return () => window.removeEventListener('close-editor', handleClose);
  }, []);

  const handleFinishWriting = async (data: { plans: string[], deepDive: { question: string, answer: string, planIdx: number }[] } | null) => {
    if (data) {
      const updated = await saveEntry(data.plans, data.deepDive);
      setEntries(updated);
      setIsWriting(false);
      setShowLatestEntry(updated[0]); // 最新の投稿をモーダルで表示
    } else {
      setIsWriting(false);
    }
  };

  const handleClearData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    alert("データをすべて削除したよ。");
  };

  return (
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
          {activeTab === "settings" && <SettingsView key="settings" />}
        </AnimatePresence>

        <AnimatePresence>
          {isWriting && (
            <JournalEditor key="editor" onFinish={handleFinishWriting} />
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

        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onClear={handleClearData} />
      </div>
    </div>
  );
}
