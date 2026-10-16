import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckSquare, MapPin, Zap, Timer, Calendar, BarChart3, Settings, Plus, RotateCcw, X } from "lucide-react";
import { api } from "../api";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenNewTask?: () => void;
}

export default function CommandMenu({ open, onClose, onOpenNewTask }: Props) {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      api.listTasks().then(setTasks).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose(); else onClose(); // handled by parent toggling
      } else if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(query.toLowerCase())) ||
    (t.tags && t.tags.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  const actions = [
    {
      label: "Create new task",
      icon: Plus,
      category: "Action",
      run: () => { onClose(); if (onOpenNewTask) onOpenNewTask(); else navigate("/app/tasks"); }
    },
    {
      label: "Go to Calendar view",
      icon: Calendar,
      category: "Navigation",
      run: () => { onClose(); navigate("/app/calendar"); }
    },
    {
      label: "Open Location Reminders & Simulator",
      icon: MapPin,
      category: "Navigation",
      run: () => { onClose(); navigate("/app/location"); }
    },
    {
      label: "Start Focus Mode (Pomodoro)",
      icon: Timer,
      category: "Action",
      run: () => { onClose(); navigate("/app/focus"); }
    },
    {
      label: "Automations Builder",
      icon: Zap,
      category: "Navigation",
      run: () => { onClose(); navigate("/app/automations"); }
    },
    {
      label: "View Productivity Analytics",
      icon: BarChart3,
      category: "Navigation",
      run: () => { onClose(); navigate("/app/analytics"); }
    },
    {
      label: "Settings & Reset Demo Data",
      icon: Settings,
      category: "Navigation",
      run: () => { onClose(); navigate("/app/settings"); }
    },
  ].filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <Search size={18} className="text-slate-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a command, search tasks, categories, or actions..."
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-4">
            {filteredTasks.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tasks</div>
                <div className="space-y-1 mt-1">
                  {filteredTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { onClose(); navigate("/app/tasks"); }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CheckSquare size={15} className={t.status === "Completed" ? "text-emerald-500" : "text-slate-400"} />
                        <span className={`truncate ${t.status === "Completed" ? "line-through text-slate-400" : ""}`}>{t.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{t.due_date || t.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Actions & Navigation</div>
              <div className="space-y-1 mt-1">
                {actions.map((act, i) => (
                  <div
                    key={i}
                    onClick={act.run}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <act.icon size={16} className="text-indigo-500" />
                      <span>{act.label}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{act.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Navigation: <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]">Enter</kbd> to select</span>
            <span>Close: <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]">Esc</kbd></span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
