import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, CheckCircle2, Flame, Sparkles, Clock, Target, Coffee } from "lucide-react";
import { api } from "../api";
import FocusTimer3D from "../components/FocusTimer3D";

export default function Focus() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<"focus" | "short_break" | "long_break">("focus");
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ total_minutes: 0, today_minutes: 0, total_sessions: 0, current_streak_days: 3 });
  
  const interval = useRef<any>(null);

  async function loadData() {
    try {
      const [tList, fStats] = await Promise.all([
        api.listTasks(),
        api.getFocusStats().catch(() => ({ total_minutes: 0, today_minutes: 0, total_sessions: 0, current_streak_days: 3 })),
      ]);
      setTasks(tList.filter((t: any) => t.status !== "Completed"));
      if (tList.length && selectedTaskId === null) {
        setSelectedTaskId(tList[0].id);
      }
      setStats(fStats);
    } catch {}
  }

  useEffect(() => {
    loadData();
  }, []);

  function setMode(type: "focus" | "short_break" | "long_break", mins: number) {
    setRunning(false);
    setSessionType(type);
    setInitialMinutes(mins);
    setSeconds(mins * 60);
  }

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(interval.current);
            setRunning(false);
            handleSessionComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval.current);
  }, [running]);

  async function handleSessionComplete() {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("SmartTask Focus Complete!", {
        body: sessionType === "focus" ? "Great job! Time for a well-deserved break." : "Break over! Ready to focus again?",
      });
    }

    try {
      await api.logFocusSession({
        task_id: selectedTaskId,
        duration_minutes: initialMinutes,
        session_type: sessionType,
        notes: sessionType === "focus" ? "Completed focus interval" : "Break interval",
      });
      loadData();
    } catch {}
  }

  async function handleCompleteTask() {
    if (!selectedTaskId) return;
    try {
      await api.completeTask(selectedTaskId);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (initialMinutes * 60);

  const activeTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="text-indigo-600 dark:text-indigo-400" size={24} />
            Focus Mode & Pomodoro
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Distraction-free environment with 3D focus kinetics and session analytics.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            <Clock size={13} /> {stats.today_minutes}m Focused Today
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <Flame size={13} /> {stats.current_streak_days} Day Streak
          </div>
        </div>
      </div>

      {/* Main Focus Chamber */}
      <div className="card p-8 bg-gradient-to-b from-white via-indigo-50/10 to-slate-50 dark:from-[#0F172A] dark:via-indigo-950/20 dark:to-[#0F172A] border-indigo-100 dark:border-indigo-950 shadow-xl overflow-hidden relative">
        {/* Session Type Selectors */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setMode("focus", 25)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sessionType === "focus"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => setMode("short_break", 5)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sessionType === "short_break"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            5m Short Break
          </button>
          <button
            onClick={() => setMode("long_break", 15)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              sessionType === "long_break"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            15m Long Break
          </button>
        </div>

        {/* 3D Hourglass Graphic & Timer Display */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="w-56 h-56 relative my-2">
            <FocusTimer3D running={running} progress={progress} />
          </div>

          <div className="font-display text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white my-3">
            {m}:{s}
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-6">
            <motion.div
              className={`h-full ${sessionType === "focus" ? "bg-indigo-600" : "bg-emerald-500"}`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="btn-primary py-3 px-8 text-sm flex items-center gap-2 shadow-lg"
            >
              {running ? <Pause size={17} /> : <Play size={17} />}
              {running ? "Pause" : "Start Session"}
            </button>

            <button
              onClick={() => {
                setRunning(false);
                setSeconds(initialMinutes * 60);
              }}
              className="btn-secondary py-3 px-4 text-sm"
              title="Reset timer"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Linked Task Selector */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Link Current Task to Focus Session</span>
            {activeTask && (
              <button
                onClick={handleCompleteTask}
                className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline font-bold"
              >
                <CheckCircle2 size={13} /> Complete This Task
              </button>
            )}
          </div>

          <select
            value={selectedTaskId || ""}
            onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="">No task linked (Free focus)</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority} priority)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
