import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Copy,
  Archive,
  Trash2,
  Pencil,
  Sparkles,
  Link as LinkIcon,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Tag,
  Repeat
} from "lucide-react";
import { api } from "../api";

const CATEGORIES = ["Academic", "Personal", "Work", "Shopping", "Health", "Finance", "General"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const priorityBadge: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  Medium: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  High: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Critical: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<number, boolean>>({});

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDueTime, setFormDueTime] = useState("18:00");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formCategory, setFormCategory] = useState("Academic");
  const [formRepeat, setFormRepeat] = useState("None");
  const [formTags, setFormTags] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [formDependencies, setFormDependencies] = useState<number[]>([]);
  
  // Location form fields
  const [useLocation, setUseLocation] = useState(false);
  const [locLabel, setLocLabel] = useState("");
  const [locCategory, setLocCategory] = useState("Supermarket");
  const [locAddress, setLocAddress] = useState("");
  const [locLat, setLocLat] = useState<number | "">("");
  const [locLng, setLocLng] = useState<number | "">("");
  const [locRadius, setLocRadius] = useState(200);

  async function loadTasks() {
    try {
      const data = await api.listTasks(filter === "Archived");
      setTasks(data);
    } catch {}
  }

  useEffect(() => {
    loadTasks();
  }, [filter]);

  function openCreate() {
    setEditing(null);
    setFormTitle("");
    setFormDesc("");
    setFormDueDate(new Date().toISOString().slice(0, 10));
    setFormDueTime("18:00");
    setFormPriority("Medium");
    setFormCategory("Academic");
    setFormRepeat("None");
    setFormTags("");
    setFormNotes("");
    setFormSubtasks([]);
    setFormDependencies([]);
    setUseLocation(false);
    setLocLabel("");
    setLocCategory("Supermarket");
    setLocAddress("");
    setLocLat("");
    setLocLng("");
    setLocRadius(200);
    setModal(true);
  }

  function openEdit(t: any) {
    setEditing(t);
    setFormTitle(t.title);
    setFormDesc(t.description || "");
    setFormDueDate(t.due_date || "");
    setFormDueTime(t.due_time || "18:00");
    setFormPriority(t.priority || "Medium");
    setFormCategory(t.category || "Academic");
    setFormRepeat(t.repeat_type || "None");
    setFormTags(t.tags || "");
    setFormNotes(t.notes || "");
    try {
      setFormSubtasks(t.subtasks ? JSON.parse(t.subtasks) : []);
    } catch {
      setFormSubtasks([]);
    }
    try {
      setFormDependencies(t.dependencies ? JSON.parse(t.dependencies) : []);
    } catch {
      setFormDependencies([]);
    }

    if (t.location) {
      setUseLocation(true);
      setLocLabel(t.location.label || "");
      setLocCategory(t.location.category || "Supermarket");
      setLocAddress(t.location.address || "");
      setLocLat(t.location.lat ?? "");
      setLocLng(t.location.lng ?? "");
      setLocRadius(t.location.radius_m || 200);
    } else {
      setUseLocation(false);
    }

    setModal(true);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocLat(coords.latitude);
        setLocLng(coords.longitude);
      },
      (error) => alert(`Unable to get your location: ${error.message}`),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    if (useLocation && (locLat === "" || locLng === "")) {
      alert("Enter the location coordinates or use your current location.");
      return;
    }

    const payload: any = {
      title: formTitle,
      description: formDesc,
      due_date: formDueDate || null,
      due_time: formDueTime || null,
      priority: formPriority,
      category: formCategory,
      repeat_type: formRepeat,
      tags: formTags,
      notes: formNotes,
      subtasks: JSON.stringify(formSubtasks),
      dependencies: JSON.stringify(formDependencies),
    };

    if (useLocation) {
      payload.location = {
        label: locLabel || formTitle,
        category: locCategory,
        address: locAddress,
        lat: Number(locLat),
        lng: Number(locLng),
        radius_m: Number(locRadius),
        trigger_type: "arrival",
      };
    }

    try {
      if (editing) {
        await api.updateTask(editing.id, payload);
      } else {
        await api.createTask(payload);
      }

      setModal(false);
      loadTasks();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleToggleComplete(t: any) {
    try {
      await api.completeTask(t.id);
      loadTasks();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleDuplicate(id: number) {
    await api.duplicateTask(id);
    loadTasks();
  }

  async function handleArchive(id: number) {
    await api.toggleArchiveTask(id);
    loadTasks();
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this task permanently?")) {
      await api.deleteTask(id);
      loadTasks();
    }
  }

  async function triggerSmartBreakdown() {
    if (!formTitle.trim()) {
      alert("Please enter a task title first before breaking down.");
      return;
    }
    try {
      const res = await api.breakdownTask(formTitle, formCategory);
      setFormSubtasks(res.subtasks || []);
    } catch (e: any) {
      alert("Error breaking down task: " + e.message);
    }
  }

  function addSubtask() {
    if (!newSubtaskTitle.trim()) return;
    setFormSubtasks([
      ...formSubtasks,
      { id: "sub_" + Date.now(), title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle("");
  }

  function removeSubtask(id: string) {
    setFormSubtasks(formSubtasks.filter((s) => s.id !== id));
  }

  async function toggleSubtaskInline(task: any, subId: string) {
    try {
      const currentSubtasks: any[] = task.subtasks ? JSON.parse(task.subtasks) : [];
      const updated = currentSubtasks.map((s) =>
        s.id === subId ? { ...s, completed: !s.completed } : s
      );
      await api.updateTask(task.id, {
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        due_time: task.due_time,
        priority: task.priority,
        category: task.category,
        repeat_type: task.repeat_type,
        subtasks: JSON.stringify(updated),
        dependencies: task.dependencies,
        tags: task.tags,
        notes: task.notes,
      });
      loadTasks();
    } catch {}
  }

  const today = new Date().toISOString().slice(0, 10);

  // Filter & Search Logic
  const filteredTasks = tasks.filter((t) => {
    if (filter === "Today") return t.due_date === today && t.status !== "Completed";
    if (filter === "Upcoming") return t.due_date > today && t.status !== "Completed";
    if (filter === "Completed") return t.status === "Completed";
    if (filter === "Overdue") return t.due_date < today && t.status !== "Completed";
    if (filter === "High Priority") return ["High", "Critical"].includes(t.priority) && t.status !== "Completed";
    if (filter === "Location") return !!t.location;
    if (filter === "Archived") return t.archived;
    return !t.archived;
  }).filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.tags && t.tags.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Task Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Organize assignments, recurring routines, prerequisites, and location geofences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreate}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            "All",
            "Today",
            "Upcoming",
            "High Priority",
            "Location",
            "Completed",
            "Overdue",
            "Archived",
          ].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, tags..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="card py-16 text-center text-slate-400">
            <CheckSquare size={36} className="mx-auto mb-2 opacity-30 text-indigo-500" />
            <p className="text-sm font-semibold">No tasks found</p>
            <p className="text-xs text-slate-400 mt-1">Try switching filters or add a new task.</p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            let subtasksList: any[] = [];
            try {
              subtasksList = t.subtasks ? JSON.parse(t.subtasks) : [];
            } catch {}
            const completedSubs = subtasksList.filter((s) => s.completed).length;

            let depIds: number[] = [];
            try {
              depIds = t.dependencies ? JSON.parse(t.dependencies) : [];
            } catch {}
            const prereqs = tasks.filter((pt) => depIds.includes(pt.id));
            const isBlocked = prereqs.some((p) => p.status !== "Completed");

            const isOverdue = t.status !== "Completed" && t.due_date && t.due_date < today;

            return (
              <div
                key={t.id}
                className={`card p-4 transition-all border ${
                  t.status === "Completed"
                    ? "bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60"
                    : isBlocked
                    ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/10"
                    : "hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(t)}
                      className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                        t.status === "Completed"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isBlocked
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-600"
                          : "border-slate-300 dark:border-slate-600 hover:border-emerald-500"
                      }`}
                      title={isBlocked ? "Prerequisite task incomplete" : "Mark as completed"}
                    >
                      {t.status === "Completed" ? (
                        <CheckCircle2 size={13} />
                      ) : isBlocked ? (
                        <span className="text-[10px]">🔒</span>
                      ) : null}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${t.status === "Completed" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                          {t.title}
                        </span>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadge[t.priority] || ""}`}>
                          {t.priority}
                        </span>

                        {t.category && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {t.category}
                          </span>
                        )}

                        {t.repeat_type !== "None" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                            <Repeat size={10} /> {t.repeat_type}
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                      )}

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                        {t.due_date && (
                          <span className={`flex items-center gap-1 font-medium ${isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                            <Calendar size={12} />
                            {t.due_date === today ? "Today" : t.due_date} {t.due_time && `· ${t.due_time}`}
                            {isOverdue && " (Overdue)"}
                          </span>
                        )}

                        {t.location && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                            <MapPin size={12} /> {t.location.label} ({t.location.radius_m}m)
                          </span>
                        )}

                        {subtasksList.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedSubtasks((prev) => ({
                                ...prev,
                                [t.id]: !prev[t.id],
                              }))
                            }
                            className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 hover:text-indigo-600"
                          >
                            <CheckSquare size={12} />
                            {completedSubs}/{subtasksList.length} subtasks
                            {expandedSubtasks[t.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}

                        {prereqs.length > 0 && (
                          <span className={`flex items-center gap-1 ${isBlocked ? "text-amber-600 dark:text-amber-400 font-medium" : "text-slate-400"}`}>
                            <LinkIcon size={12} />
                            Prerequisite: {prereqs.map((p) => p.title).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      onClick={() => handleDuplicate(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Duplicate task"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleArchive(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title={t.archived ? "Restore task" : "Archive task"}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Edit task"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expandable Subtasks Checklist */}
                {expandedSubtasks[t.id] && subtasksList.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 pl-8">
                    {subtasksList.map((sub: any) => (
                      <div
                        key={sub.id}
                        onClick={() => toggleSubtaskInline(t, sub.id)}
                        className="flex items-center gap-2.5 text-xs cursor-pointer text-slate-700 dark:text-slate-300 hover:text-indigo-600"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            sub.completed ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {sub.completed && <CheckCircle2 size={10} />}
                        </div>
                        <span className={sub.completed ? "line-through text-slate-400" : ""}>{sub.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation & Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSave}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  {editing ? "Edit Task" : "Create New Task"}
                </h3>
                <button
                  type="button"
                  onClick={triggerSmartBreakdown}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100"
                  title="Auto-generate subtasks based on goal name"
                >
                  <Sparkles size={13} /> Smart Breakdown
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Complete Lab Record or Buy Groceries"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description & Notes</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Add extra context or instructions..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Due Date, Time, Priority, Category */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurrence & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Recurrence</label>
                  <select
                    value={formRepeat}
                    onChange={(e) => setFormRepeat(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  >
                    <option value="None">None (One-time)</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prerequisite Task (DAG Dependency)</label>
                  <select
                    value={formDependencies[0] || ""}
                    onChange={(e) => setFormDependencies(e.target.value ? [Number(e.target.value)] : [])}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                  >
                    <option value="">No prerequisite</option>
                    {tasks
                      .filter((t) => !editing || t.id !== editing.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.status})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Subtasks Checklist Section */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-indigo-600" /> Subtasks Checklist ({formSubtasks.length})
                  </span>
                  <span className="text-[11px] text-slate-400">Click Smart Breakdown above for suggestions</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {formSubtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="truncate">{sub.title}</span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(sub.id)}
                        className="text-slate-400 hover:text-rose-500 font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask step..."
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Location Geofence Attachment */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLocation}
                      onChange={(e) => setUseLocation(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Attach Real Location Reminder (Geofence)
                  </label>
                  {useLocation && (
                    <span className="text-[11px] font-semibold text-indigo-600">
                      Geofence Radius: {locRadius}m
                    </span>
                  )}
                </div>

                {useLocation && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Use my current location
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Place Name</label>
                        <input
                          type="text"
                          value={locLabel}
                          onChange={(e) => setLocLabel(e.target.value)}
                          placeholder="e.g. Reliance Fresh Supermarket"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                        <select
                          value={locCategory}
                          onChange={(e) => setLocCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                        >
                          <option>Supermarket</option>
                          <option>Pharmacy</option>
                          <option>College</option>
                          <option>Gym</option>
                          <option>Shopping mall</option>
                          <option>Bank</option>
                          <option>Cafe</option>
                          <option>Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={locLat}
                          onChange={(e) => setLocLat(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={locLng}
                          onChange={(e) => setLocLng(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Radius (meters)</label>
                        <select
                          value={locRadius}
                          onChange={(e) => setLocRadius(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                        >
                          <option value={100}>100 meters</option>
                          <option value={200}>200 meters (Recommended)</option>
                          <option value={300}>300 meters</option>
                          <option value={500}>500 meters</option>
                          <option value={1000}>1 kilometer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5"
                >
                  {editing ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
