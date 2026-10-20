import { useState, useEffect } from "react";
import { User, Bell, MapPin, Moon, Sun, Download, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifPerm, setNotifPerm] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [geoStatus, setGeoStatus] = useState<string>("Checking GPS status...");
  const [dark, setDark] = useState<boolean>(
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPerm(Notification.permission);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoStatus(`Available (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`),
        () => setGeoStatus("Permission prompt or denied")
      );
    } else {
      setGeoStatus("Not supported");
    }
  }, []);

  function toggleDark() {
    if (dark) {
      document.documentElement.classList.remove("dark");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }

  async function requestNotification() {
    if ("Notification" in window) {
      const p = await Notification.requestPermission();
      setNotifPerm(p);
      if (p === "granted") {
        new Notification("SmartTask Notifications Enabled!", {
          body: "You will receive real geofence and task reminders.",
          icon: "/favicon.png",
        });
      }
    }
  }

  function testNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("SmartTask Live Test Notification 🔔", {
        body: "Real browser notification triggered successfully!",
        icon: "/favicon.png",
      });
    } else {
      alert("Notification permission is not granted yet. Click 'Request Permission' first.");
    }
  }

  async function exportData() {
    try {
      const [tasks, reminders, automations] = await Promise.all([
        api.listTasks(true),
        api.listLocationReminders(),
        api.listAutomations(),
      ]);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify({ exportDate: new Date(), user, tasks, reminders, automations }, null, 2)
      );
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `smarttask_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      alert("Error exporting data: " + e.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Application Settings & Diagnostics
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure notifications, device permissions, and visual theme.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <User size={16} className="text-indigo-600" /> User Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Full Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{user?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Email Address</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Real Permissions Diagnostic Card */}
      <div className="card p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Shield size={16} className="text-indigo-600" /> Platform Permissions & Web API Status
        </h3>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Notification Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Bell size={14} className="text-indigo-500" /> System / Browser Notification API
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Required for real background geofence alarms and task deadline notifications.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                notifPerm === "granted"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}>
                {notifPerm}
              </span>

              {notifPerm !== "granted" ? (
                <button
                  onClick={requestNotification}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Request Permission
                </button>
              ) : (
                <button
                  onClick={testNotification}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Send Test Alert
                </button>
              )}
            </div>
          </div>

          {/* Location Permission */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-500" /> Geolocation Sensor
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Status: {geoStatus}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Appearance Theme */}
      <div className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          {dark ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
          Appearance & Theme
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {dark ? "Dark Theme Enabled" : "Light Theme Enabled"}
            </div>
            <div className="text-slate-400">
              High-contrast professional slate & deep charcoal palette.
            </div>
          </div>

          <button
            onClick={toggleDark}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            Toggle {dark ? "Light" : "Dark"} Mode
          </button>
        </div>
      </div>

      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Data Backup</h3>
          <p className="text-xs text-slate-500 mt-1">Download a JSON backup of your tasks, reminders, and automations.</p>
        </div>
        <button
          onClick={exportData}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-shrink-0"
        >
          <Download size={14} /> Export Backup
        </button>
      </div>
    </div>
  );
}
