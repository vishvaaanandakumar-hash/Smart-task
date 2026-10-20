import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Trash2, Bell, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { api } from "../api";

export default function Automations() {
  const [list, setList] = useState<any[]>([]);
  const [trigger, setTrigger] = useState("Task reaches deadline");
  const [condition, setCondition] = useState("Task is incomplete");
  const [action, setAction] = useState("Send notification");

  async function load() {
    try {
      setList(await api.listAutomations());
    } catch {}
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await api.createAutomation({
      trigger_type: trigger,
      condition: condition,
      action_type: action,
      enabled: true,
    });
    load();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="text-indigo-600 dark:text-indigo-400" size={24} />
          Rule-Based Task Automations
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Define event-driven pipelines that automate notifications, priority escalations, and recurring schedules.
        </p>
      </div>

      {/* Visual Pipeline Rule Builder */}
      <div className="card p-6 border-indigo-100 dark:border-indigo-950/80 bg-gradient-to-br from-white to-indigo-50/20 dark:from-[#111827] dark:to-indigo-950/20 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
            Pipeline Builder
          </span>
          <span className="text-xs text-slate-400">Configure event triggers, conditions, and automated actions</span>
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* WHEN */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                1. WHEN (Trigger Event)
              </div>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none py-1"
              >
                <option value="Task reaches deadline">Task reaches deadline</option>
                <option value="Arrive at a location">Arrive at a location (Geofence)</option>
                <option value="Task completed">Task completed</option>
                <option value="Task marked Critical">Task marked Critical</option>
                <option value="Deadline is tomorrow">Deadline is tomorrow</option>
              </select>
            </div>

            {/* IF */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                2. IF (Condition Check)
              </div>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none py-1"
              >
                <option value="Task is incomplete">Task is incomplete</option>
                <option value="Linked task is pending">Linked task is pending</option>
                <option value="Due within 24 hours">Due within 24 hours</option>
                <option value="Task is recurring">Task is recurring</option>
                <option value="No condition">Always (No condition)</option>
              </select>
            </div>

            {/* THEN */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                3. THEN (Action Execution)
              </div>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none py-1"
              >
                <option value="Send notification">Send browser & system notification</option>
                <option value="Escalate priority">Escalate priority to Critical</option>
                <option value="Create next occurrence">Create next recurring occurrence</option>
                <option value="Mark complete">Mark task as complete</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5">
              <Plus size={15} /> Save Automation Rule
            </button>
          </div>
        </form>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
          Active Automation Rules ({list.length})
        </h3>

        {list.map((a) => (
          <div
            key={a.id}
            className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                WHEN
              </span>
              <span className="text-slate-800 dark:text-slate-200">{a.trigger_type}</span>
              
              <ArrowRight size={13} className="text-slate-400" />
              
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                IF
              </span>
              <span className="text-slate-600 dark:text-slate-400">{a.condition}</span>
              
              <ArrowRight size={13} className="text-slate-400" />
              
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                THEN
              </span>
              <span className="text-slate-800 dark:text-slate-200">{a.action_type}</span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={async () => {
                  await api.deleteAutomation(a.id);
                  load();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete rule"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <div className="card py-12 text-center text-slate-400 text-xs">
            No automations configured yet. Create a WHEN → IF → THEN rule above.
          </div>
        )}
      </div>
    </div>
  );
}
