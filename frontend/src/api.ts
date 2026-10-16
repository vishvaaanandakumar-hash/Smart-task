const envApi = import.meta.env.VITE_API_URL;
const BASE = envApi ? envApi.replace(/\/+$/, "") : (import.meta.env.DEV ? "http://localhost:8000" : "");

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    let detail = "Something went wrong. Please try again.";
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (name: string, email: string, password: string) =>
    req("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  demoLogin: () => req("/auth/demo-login", { method: "POST" }),
  me: () => req("/auth/me"),
  resetDemoData: () => req("/auth/reset-demo", { method: "POST" }),

  listTasks: (includeArchived = false) => req(`/tasks?include_archived=${includeArchived}`),
  createTask: (data: any) => req("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: any) => req(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: number) => req(`/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id: number) => req(`/tasks/${id}/complete`, { method: "POST" }),
  duplicateTask: (id: number) => req(`/tasks/${id}/duplicate`, { method: "POST" }),
  toggleArchiveTask: (id: number) => req(`/tasks/${id}/archive`, { method: "POST" }),
  breakdownTask: (title: string, category = "General") =>
    req("/tasks/breakdown", { method: "POST", body: JSON.stringify({ title, category }) }),

  searchPlaces: (query: string, lat = 13.0067, lng = 80.1187) =>
    req(`/location/search?query=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`),
  nearby: (lat: number, lng: number, category: string, radius = 2000) =>
    req(`/location/nearby?lat=${lat}&lng=${lng}&category=${encodeURIComponent(category)}&radius=${radius}`),
  listLocationReminders: () => req("/location/reminders"),
  setLocationStatus: (id: number, status: string) =>
    req(`/location/reminders/${id}?status_val=${status}`, { method: "PUT" }),
  resetLocationReminder: (id: number) =>
    req(`/location/reminders/${id}/reset`, { method: "POST" }),
  deleteLocationReminder: (id: number) => req(`/location/reminders/${id}`, { method: "DELETE" }),
  checkGeofence: (lat: number, lng: number) => req(`/location/check?lat=${lat}&lng=${lng}`, { method: "POST" }),

  listAutomations: () => req("/automations"),
  createAutomation: (data: any) => req("/automations", { method: "POST", body: JSON.stringify(data) }),
  deleteAutomation: (id: number) => req(`/automations/${id}`, { method: "DELETE" }),

  listNotifications: () => req("/notifications"),
  markRead: (id: number) => req(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () => req(`/notifications/read-all`, { method: "PUT" }),

  listFocusSessions: () => req("/focus/sessions"),
  logFocusSession: (data: any) => req("/focus/sessions", { method: "POST", body: JSON.stringify(data) }),
  getFocusStats: () => req("/focus/stats"),

  analytics: () => req("/analytics"),
};
