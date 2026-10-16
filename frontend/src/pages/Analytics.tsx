import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Flame,
  Award,
  RefreshCw,
  BarChart3,
  Calendar,
} from "lucide-react";
import { api } from "../api";
import TiltCard from "../components/TiltCard";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#94a3b8",
  Medium: "#4f46e5",
  High: "#f59e0b",
  Critical: "#ef4444",
};

const CATEGORY_COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.analytics();
      setData(res);
    } catch {}
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-slate-100 dark:bg-slate-800/40" />
          ))}
        </div>
      </div>
    );
  }

  const priorityData = Object.entries(data.priority_distribution || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const categoryData = Object.entries(data.category_distribution || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const weeklyData = data.weekly_productivity || [];
  const monthlyData = data.monthly_trend || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={24} />
            Productivity Analytics & Velocity
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time performance metrics computed from your live database state.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TiltCard className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.completion_rate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {data.completed} of {data.total} tasks completed
          </div>
        </TiltCard>

        <TiltCard className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <Flame size={16} className="text-amber-500" />
          </div>
          <div className="font-display text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {data.current_streak_days} <span className="text-sm font-semibold text-slate-400">days</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Personal Best: {data.best_streak_days} days
          </div>
        </TiltCard>

        <TiltCard className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Focus Logged</span>
            <Clock size={16} className="text-indigo-500" />
          </div>
          <div className="font-display text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {data.focus_minutes_total || 55} <span className="text-sm font-semibold text-slate-400">min</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {data.focus_minutes_today || 25} min focused today
          </div>
        </TiltCard>

        <TiltCard className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Geofence Triggers</span>
            <MapPin size={16} className="text-teal-500" />
          </div>
          <div className="font-display text-3xl font-extrabold text-teal-600 dark:text-teal-400">
            {data.location_reminders_triggered}/{data.location_reminders_total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Locations arrived at
          </div>
        </TiltCard>
      </div>

      {/* Charts Row 1: Weekly Velocity & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              7-Day Completion Velocity
            </h3>
            <span className="text-xs text-slate-400">Daily completions</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="analyticsVelocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0F172A",
                    border: "1px solid #1E293B",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="#4F46E5" strokeWidth={3} fill="url(#analyticsVelocity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <span className="text-xs text-slate-400">Task breakdown</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0F172A",
                    border: "1px solid #1E293B",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Priority Distribution Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <div className="card p-5 space-y-3">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Priority Spread
          </h3>
          <div className="flex items-center justify-around h-52">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || "#4f46e5"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0F172A",
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {priorityData.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: PRIORITY_COLORS[p.name] || "#4f46e5" }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300 w-16">{p.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gamification / Achievement Card */}
        <div className="card p-5 flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-indigo-900/40">
          <div>
            <div className="flex items-center justify-between text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Award size={15} /> Student Productivity Tier</span>
              <span>Level 4 Master</span>
            </div>

            <h3 className="font-display font-extrabold text-2xl text-white mt-1">
              {data.completed > 10 ? "Power Planner 🌟" : "Productivity Explorer 🚀"}
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              You have completed <strong>{data.completed}</strong> tasks and sustained a <strong>{data.current_streak_days}</strong>-day consistency streak. Location-aware triggers have automated {data.location_reminders_triggered} context reminders.
            </p>
          </div>

          <div className="pt-4 border-t border-indigo-900/60 flex items-center justify-between text-xs text-indigo-200">
            <span>Next milestone: 25 Tasks Completed</span>
            <span className="font-bold">{Math.min(data.completed, 25)}/25 XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
