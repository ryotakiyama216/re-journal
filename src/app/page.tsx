"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type Tab = "home" | "history" | "insights" | "settings";

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (tab: Tab) => void }) => {
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

const JournalEditor = ({ onFinish }: { onFinish: () => void }) => {
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-50 z-[60] flex flex-col overflow-hidden"
    >
      {/* 背景の装飾的な要素 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200 rounded-full blur-[120px] opacity-40 pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full flex flex-col h-full px-10 relative z-10">
        <header className="py-16 flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-stone-100">
                <span className="text-3xl font-light font-mono text-stone-800 tracking-tighter">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="text-stone-300">
                <Wind size={20} className="animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-stone-400 font-bold ml-1">
              Deep Breathing Time
            </p>
          </div>
          
          <button 
            onClick={onFinish}
            className="group flex items-center gap-3 px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white text-stone-400 hover:text-stone-800 hover:bg-white transition-all shadow-sm"
          >
            <span className="text-xs font-medium tracking-wide">Pause</span>
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </header>

        <main className="flex-1 flex flex-col relative">
          <div className="absolute -left-8 top-0 text-stone-100 pointer-events-none">
            <Quote size={64} fill="currentColor" />
          </div>
          
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="浮かんでくる思考を、そのままに..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-3xl font-serif font-light leading-[1.6] text-stone-800 placeholder-stone-200 resize-none pt-4"
          />

          {/* 入力中の装飾的なフィードバック */}
          <AnimatePresence>
            {text.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-10 left-0 flex items-center gap-3 text-stone-300"
              >
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                <span className="text-[10px] tracking-[0.2em] uppercase font-medium">Capturing your thoughts...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-16 flex justify-between items-center">
          <div className="flex gap-4">
            <button className="w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-stone-300 hover:text-stone-800 hover:border-stone-300 transition-all shadow-sm">
              <Sparkles size={20} />
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-stone-300 hover:text-stone-800 hover:border-stone-300 transition-all shadow-sm">
              <Layers size={20} />
            </button>
          </div>
          
          <button
            onClick={onFinish}
            disabled={!text}
            className={cn(
              "group relative px-12 py-5 rounded-[2rem] font-medium transition-all overflow-hidden shadow-2xl",
              text 
                ? "bg-stone-900 text-stone-50 hover:scale-105 active:scale-95" 
                : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              書き終える
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </footer>
      </div>
    </motion.div>
  );
};

const HistoryView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-12 pb-40 pt-8"
  >
    <div className="flex justify-between items-baseline">
      <h2 className="text-4xl font-serif font-light text-stone-900">History</h2>
      <span className="text-stone-300 text-xs font-mono tracking-widest uppercase">Feb 2024</span>
    </div>

    <div className="grid gap-8">
      {[
        { day: "09", dow: "Fri", title: "静かな朝の記録", preview: "今日は少し早く起きて、窓の外を眺めながら..." },
        { day: "05", dow: "Mon", title: "心の整理", preview: "週末の出来事を振り返って、自分の気持ちを..." },
        { day: "04", dow: "Sun", title: "雨の日の思考", preview: "雨音を聞きながら、これからのことを..." }
      ].map((item, i) => (
        <motion.div
          key={i}
          whileHover={{ x: 10 }}
          className="group flex gap-6 items-start cursor-pointer"
        >
          <div className="flex flex-col items-center w-16 h-20 bg-stone-50 rounded-3xl flex-shrink-0 justify-center group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl">
            <span className="text-[10px] font-bold tracking-tighter opacity-50 mb-1 uppercase">{item.dow}</span>
            <span className="text-2xl font-serif leading-none">{item.day}</span>
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 bg-stone-300 rounded-full" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-stone-300 uppercase">Journal Entry</span>
            </div>
            <h3 className="text-xl font-serif font-light text-stone-800 group-hover:text-stone-500 transition-colors">{item.title}</h3>
            <p className="text-stone-400 text-sm font-light leading-relaxed line-clamp-1">
              {item.preview}
            </p>
          </div>
        </motion.div>
      ))}
      
      <div className="pt-12 flex flex-col items-center gap-6 opacity-30">
        <div className="w-[1px] h-20 bg-gradient-to-b from-stone-400 to-transparent" />
        <p className="text-[10px] tracking-[0.5em] uppercase text-stone-500">Resting Days</p>
      </div>
    </div>
  </motion.div>
);

const InsightsView = () => (
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
        <h3 className="text-4xl font-serif text-white font-light">穏やかな凪</h3>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-end gap-3 h-24">
          {[
            { h: 30, day: "03", dow: "Sat" },
            { h: 45, day: "04", dow: "Sun" },
            { h: 35, day: "05", dow: "Mon" },
            { h: 60, day: "06", dow: "Tue" },
            { h: 40, day: "07", dow: "Wed" },
            { h: 55, day: "08", dow: "Thu" },
            { h: 45, day: "09", dow: "Fri" }
          ].map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${item.h}%` }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="w-full bg-white/20 rounded-full hover:bg-white/40 transition-colors cursor-help"
              />
              <div className="flex flex-col items-center opacity-40">
                <span className="text-[8px] font-mono text-white uppercase">{item.dow}</span>
                <span className="text-[10px] font-serif text-white">{item.day}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div className="p-8 bg-white border border-stone-100 rounded-[2.5rem] space-y-4 shadow-sm">
        <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800">
          <Zap size={20} />
        </div>
        <div>
          <p className="text-stone-300 text-[10px] tracking-widest uppercase mb-1">Streak</p>
          <p className="text-3xl font-serif text-stone-800">03</p>
        </div>
      </div>
      <div className="p-8 bg-white border border-stone-100 rounded-[2.5rem] space-y-4 shadow-sm">
        <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800">
          <Cloud size={20} />
        </div>
        <div>
          <p className="text-stone-300 text-[10px] tracking-widest uppercase mb-1">Focus</p>
          <p className="text-3xl font-serif text-stone-800">Self</p>
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

  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-100">
      <div className="max-w-md mx-auto px-8 min-h-screen relative">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <JournalHome key="home" onStart={() => setIsWriting(true)} />
          )}
          {activeTab === "history" && <HistoryView key="history" />}
          {activeTab === "insights" && <InsightsView key="insights" />}
          {activeTab === "settings" && <SettingsView key="settings" />}
        </AnimatePresence>

        <AnimatePresence>
          {isWriting && (
            <JournalEditor key="editor" onFinish={() => setIsWriting(false)} />
          )}
        </AnimatePresence>

        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
