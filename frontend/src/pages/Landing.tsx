import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Bell, CheckCircle2, Zap, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Hero3D from "../components/Hero3D";
import TiltCard from "../components/TiltCard";

export default function Landing() {
  const { demoLogin, user } = useAuth();
  const nav = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleInstantDemo(destination = "/app") {
    if (user) {
      nav(destination);
      return;
    }
    setDemoLoading(true);
    try {
      await demoLogin();
      nav(destination);
    } catch {
      nav("/login");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-offwhite dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles size={18} />
          </div>
          <span className="font-display font-bold text-lg text-navy dark:text-white">SmartTask</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleInstantDemo("/app")}
            disabled={demoLoading}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>⚡ Try Demo</span>
          </button>
          <Link to="/login" className="btn-secondary text-xs py-1.5 px-3.5">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center px-8 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles size={13} /> Smart Student & Professional Productivity
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1] font-bold text-navy dark:text-white">
            Manage tasks.<br />Automate actions.<br />
            <span className="text-indigo">Remember where you are.</span>
          </h1>
          <p className="mt-4 text-base text-black/60 dark:text-slate-300 max-w-md">
            SmartTask combines academic tasks, automatic deadline actions, focus mode and location-aware geofence alerts into one unified workspace.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <button
              onClick={() => handleInstantDemo("/app")}
              disabled={demoLoading}
              className="btn-primary flex items-center gap-2 py-3 px-5 text-sm font-semibold shadow-lg shadow-indigo-600/20"
            >
              {demoLoading ? "Launching..." : (
                <>
                  <Sparkles size={16} className="text-amber-300" />
                  <span>⚡ Instant Live Demo</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            <button
              onClick={() => handleInstantDemo("/app/location")}
              className="btn-secondary flex items-center gap-1.5 py-3 px-4 text-sm font-medium"
            >
              <MapPin size={15} className="text-indigo-500" />
              <span>Location Radar</span>
            </button>
            <Link to="/login" className="px-4 py-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              Sign In with Email →
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-black/40 dark:text-slate-400">
            <span>Demo credentials:</span>
            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-mono">
              demo@smarttask.app / SmartTask123
            </code>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative">
          <div className="h-80 md:h-[26rem]" style={{ filter: "drop-shadow(0 25px 40px rgba(20,33,61,.18))" }}>
            <Hero3D />
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="card p-3 flex items-center gap-2 text-sm absolute bottom-2 left-1/2 -translate-x-1/2 w-64 shadow-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <Bell size={15} className="text-indigo flex-shrink-0 animate-bounce" />
            <span className="text-xs font-medium">You're near a supermarket — don't forget the milk!</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-4 gap-4 px-8 pb-20">
        {[
          [CheckCircle2, "Smart task management", "Priorities, categories, subtasks, and dependency chains."],
          [MapPin, "Location reminders", "Live geofence radar notifying you when you arrive near stores or campus."],
          [Zap, "Automations", "Intelligent triggers acting on deadlines and task status changes."],
          [BarChart3, "Real analytics", "Live productivity breakdown, streaks, and completion velocity."],
        ].map(([Icon, t, d]: any, i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}>
            <TiltCard className="p-5 h-full flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{t}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{d}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
