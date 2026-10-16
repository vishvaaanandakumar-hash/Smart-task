import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function Login() {
  const { login, demoLogin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("demo@smarttask.app");
  const [password, setPassword] = useState("SmartTask123");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      nav("/app");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInstantDemo() {
    setError("");
    setDemoLoading(true);
    try {
      await demoLogin();
      nav("/app");
    } catch (err: any) {
      setError(err.message || "Demo login failed. Please try manual login.");
    } finally {
      setDemoLoading(false);
    }
  }

  function setPreset(presetEmail: string, presetPass: string) {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite dark:bg-[#0B0F19] px-4 py-8">
      <div className="card p-8 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Sparkles size={20} />
            </div>
            <span className="font-display font-bold text-xl text-slate-900 dark:text-white">
              SmartTask
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to your productivity workspace
          </p>
        </div>

        {/* 1-Click Instant Demo Login Button */}
        <button
          type="button"
          onClick={handleInstantDemo}
          disabled={demoLoading || loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 mb-5"
        >
          {demoLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={17} className="text-amber-300" />
              <span>⚡ 1-Click Instant Demo Login</span>
              <ArrowRight size={15} className="ml-1" />
            </>
          )}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            or sign in with password
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
        </div>

        {error && (
          <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="demo@smarttask.app"
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {show ? <EyeOff size={13} /> : <Eye size={13} />}
                {show ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative mt-1">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="btn-primary w-full py-2.5 text-sm font-semibold mt-2 shadow-sm"
          >
            {loading ? "Signing in..." : "Sign in to Dashboard"}
          </button>
        </form>

        {/* Quick Demo Credential Fillers */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 text-center mb-2">
            Preset Demo Accounts (click to auto-fill):
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => setPreset("demo@smarttask.app", "SmartTask123")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between text-left transition-colors"
            >
              <span><strong>Web Demo:</strong> demo@smarttask.app</span>
              <span className="font-mono text-[10px] text-slate-400">SmartTask123</span>
            </button>
            <button
              type="button"
              onClick={() => setPreset("vishvaa@smarttask.app", "Password123!")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between text-left transition-colors"
            >
              <span><strong>App Demo:</strong> vishvaa@smarttask.app</span>
              <span className="font-mono text-[10px] text-slate-400">Password123!</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-5">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
