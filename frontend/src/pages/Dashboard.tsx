import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Flame,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckSquare,
  Zap,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import Dashboard3D from "../components/Dashboard3D";
import TiltCard from "../components/TiltCard";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [locs, setLocs] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [tList, lList, aData] = await Promise.all([
        api.listTasks(),
        api.listLocationReminders().catch(() => []),
        api.analytics().catch(() => null),
      ]);
      setTasks(tList);
      setLocs(lList);
      setAnalyticsData(aData);
    } catch {}
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const pendingTasks = tasks.filter((t) => t.status !== "Completed");
  const todaysTasks = tasks.filter((t) => t.due_date === today);
  const todaysDone = todaysTasks.filter((t) => t.status === "Completed");
  const overdueTasks = tasks.filter((t) => t.status !== "Completed" && t.due_date && t.due_date < today);
  const monitoringLocs = locs.filter((l) => l.status === "monitoring");

  const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const weekly = analyticsData?.weekly_productivity || [];
  const streak = analyticsData?.current_streak_days || 3;

  async function handleToggle(taskId: number) {
    try {
      await api.completeTask(taskId);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Good day, {user?.name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · Here is your productivity briefing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/app/tasks"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Quick Add Task
          </Link>
          <Link
            to="/app/location"
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <MapPin size={14} className="text-indigo-500" /> Simulator
          </Link>
        </div>
      </div>

      {/* Hero Overview Strip with 3D Hologram */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <TiltCard className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Tasks</span>
              <CheckSquare size={16} className="text-indigo-500" />
            </div>
            <div className="mt-3">
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {todaysDone.length} <span className="text-sm font-normal text-slate-400">/ {todaysTasks.length}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {todaysTasks.length - todaysDone.length} remaining today
              </div>
            </div>
          </TiltCard>

          <TiltCard className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="mt-3">
              <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedTasks.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {completionRate}% completion rate
              </div>
            </div>
          </TiltCard>

          <TiltCard className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <div className="mt-3">
              <div className={`font-display text-2xl font-bold ${overdueTasks.length ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                {overdueTasks.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {overdueTasks.length ? "Needs immediate attention" : "All deadlines on track"}
              </div>
            </div>
          </TiltCard>

          <TiltCard className="p-4 flex flex-col justify-between border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Geofences</span>
              <MapPin size={16} className="text-indigo-500" />
            </div>
            <div className="mt-3">
              <div className="font-display text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {monitoringLocs.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Active location radars
              </div>
            </div>
          </TiltCard>
        </div>

        {/* 3D Productivity Hologram Card */}
        <div className="card p-4 flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-indigo-900/50 shadow-md">
          <div className="w-1/2 h-36">
            <Dashboard3D completionRate={completionRate} />
          </div>
          <div className="w-1/2 pl-2 space-y-1 z-10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> Productivity Core
            </div>
            <div className="font-display text-3xl font-extrabold text-white">
              {completionRate}%
            </div>
            <div className="text-xs text-indigo-200 font-medium flex items-center gap-1">
              <Flame size={13} className="text-amber-400" /> {streak}-Day Streak!
            </div>
            <div className="text-[10px] text-slate-400 pt-1">
              Live database state
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Weekly Progress & Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Today's / Upcoming Tasks */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                Today's Action Items
              </h3>
              <p className="text-xs text-slate-500">Tasks scheduled for today or high priority</p>
            </div>
            <Link
              to="/app/tasks"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View all ({tasks.length}) <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-slate-50/50 dark:bg-slate-900/40 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(t.id)}
                    className="mt-0.5 w-4 h-4 rounded border border-slate-300 dark:border-slate-600 hover:border-emerald-500 flex items-center justify-center transition-colors flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {t.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.priority === "Critical"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : t.priority === "High"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {t.priority}
                      </span>
                      {t.category && <span>{t.category}</span>}
                      {t.due_time && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock size={11} /> {t.due_time}
                        </span>
                      )}
                      {t.location && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                          <MapPin size={11} /> {t.location.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  to="/app/tasks"
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex-shrink-0"
                >
                  Edit
                </Link>
              </div>
            ))}

            {pendingTasks.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending tasks on your agenda right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Productivity & Location Radar */}
        <div className="space-y-6">
          {/* Weekly Progress Chart */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp size={15} className="text-indigo-600" /> Weekly Productivity
              </h3>
              <span className="text-xs font-semibold text-slate-400">Past 7 Days</span>
            </div>

            {weekly.length ? (
              <div className="h-40 w-full text-indigo-600">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekly}>
                    <defs>
                      <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0F172A",
                        border: "1px solid #1E293B",
                        borderRadius: 8,
                        color: "#fff",
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="completed" stroke="#4F46E5" strokeWidth={2.5} fill="url(#dashboardArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                Complete tasks to view weekly velocity.
              </div>
            )}
          </div>

          {/* Quick Location Reminders Status */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={15} className="text-indigo-600" /> Geofence Monitor
              </h3>
              <Link to="/app/location" className="text-xs text-indigo-600 font-semibold hover:underline">
                Open Map
              </Link>
            </div>

            <div className="space-y-2">
              {locs.slice(0, 3).map((l) => (
                <div key={l.id} className="text-xs flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${l.status === "monitoring" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{l.label}</span>
                  </div>
                  <span className="text-slate-400 font-medium flex-shrink-0">{l.radius_m}m</span>
                </div>
              ))}
              {locs.length === 0 && (
                <div className="text-xs text-slate-400 py-3 text-center">
                  No location reminders active.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
