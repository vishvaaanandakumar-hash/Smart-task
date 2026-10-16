import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CheckSquare,
  MapPin,
  Zap,
  BarChart3,
  Timer,
  Settings,
  Bell,
  LogOut,
  Calendar,
  Search,
  CheckCircle2,
  Archive,
  Menu,
  X,
  Sparkles,
  Command,
  Compass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import CommandMenu from "./CommandMenu";

const mainNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/tasks", label: "My Tasks", icon: CheckSquare },
  { to: "/app/calendar", label: "Calendar", icon: Calendar },
  { to: "/app/location", label: "Location", icon: MapPin },
  { to: "/app/automations", label: "Automations", icon: Zap },
  { to: "/app/focus", label: "Focus Mode", icon: Timer },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function refreshNotifs() {
    try {
      setNotifs(await api.listNotifications());
    } catch {}
  }

  useEffect(() => {
    refreshNotifs();
    const id = setInterval(refreshNotifs, 10000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
      {/* Global Command Menu (Ctrl + K) */}
      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                SmartTask
              </div>
              <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                Pro Automation
              </div>
            </div>
          </div>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search size={14} /> Search or command...
            </span>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono font-medium">
              Ctrl K
            </kbd>
          </button>

          {/* Main Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Core Modules
            </div>
            {mainNav.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                <t.icon size={16} />
                <span>{t.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Views & Filters */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Views
            </div>
            <button
              onClick={() => navigate("/app/tasks")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Completed Tasks</span>
            </button>
            <button
              onClick={() => navigate("/app/tasks")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Archive size={16} className="text-slate-400" />
              <span>Archived Archive</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Settings & User Profile */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`
            }
          >
            <Settings size={16} />
            <span>Settings & Demo Data</span>
          </NavLink>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 lg:hidden text-slate-600"
            >
              <Menu size={18} />
            </button>
            <div className="text-xs text-slate-500">
              Active workspace: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{user?.name}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Button for Mobile / Header */}
            <button
              onClick={() => setCmdOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Search or Quick Command (Ctrl+K)"
            >
              <Search size={16} />
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-84 sm:w-96 card p-3 shadow-2xl z-50 max-h-[460px] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell size={14} className="text-indigo-600" /> Notifications & Alarms
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            await api.markAllRead();
                            refreshNotifs();
                          }}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto my-2 space-y-1 max-h-72">
                      {notifs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications logged yet.
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.is_read) {
                                await api.markRead(n.id);
                                refreshNotifs();
                              }
                            }}
                            className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                              n.is_read
                                ? "opacity-60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                : "bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 font-medium"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span>{n.message}</span>
                              {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 flex-shrink-0"></span>}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="relative w-72 h-full bg-white dark:bg-[#0F172A] p-5 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-display font-bold text-lg text-slate-900 dark:text-white">SmartTask</div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-1">
                  {mainNav.map((t) => (
                    <NavLink
                      key={t.to}
                      to={t.to}
                      end={t.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`
                      }
                    >
                      <t.icon size={17} />
                      <span>{t.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <NavLink
                  to="/app/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  <Settings size={17} /> Settings
                </NavLink>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={17} /> Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
