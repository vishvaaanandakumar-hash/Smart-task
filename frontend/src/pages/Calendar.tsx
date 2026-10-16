import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, MapPin, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../api";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newCategory, setNewCategory] = useState("Academic");

  async function loadTasks() {
    try {
      const data = await api.listTasks();
      setTasks(data);
    } catch {}
  }
  useEffect(() => { loadTasks(); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }
  function goToToday() {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now.toISOString().slice(0, 10));
  }

  // Days matrix
  const calendarDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = new Date(year, month - 1, d).toISOString().slice(0, 10);
    calendarDays.push({ dayNumber: d, isCurrentMonth: false, dateStr });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = new Date(year, month, i).toISOString().slice(0, 10);
    calendarDays.push({ dayNumber: i, isCurrentMonth: true, dateStr });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const dateStr = new Date(year, month + 1, i).toISOString().slice(0, 10);
    calendarDays.push({ dayNumber: i, isCurrentMonth: false, dateStr });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDayTasks = tasks.filter(t => t.due_date === selectedDate);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.createTask({
      title: newTitle,
      due_date: selectedDate,
      due_time: "18:00",
      priority: newPriority,
      category: newCategory,
    });
    setNewTitle("");
    setShowModal(false);
    loadTasks();
  }

  const priorityColor: Record<string, string> = {
    Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Medium: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    High: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Critical: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" size={24} />
            Calendar & Schedule
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Visualize your deadlines, recurring commitments, and location reminders.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Today
          </button>
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5">
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Month Grid */}
        <div className="card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarDays.map((cd, index) => {
              const dayTasks = tasks.filter(t => t.due_date === cd.dateStr);
              const isSelected = selectedDate === cd.dateStr;
              const isToday = todayStr === cd.dateStr;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(cd.dateStr)}
                  className={`min-h-[92px] p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                    !cd.isCurrentMonth ? "opacity-35 bg-slate-50/30 dark:bg-slate-950/20" : "bg-white dark:bg-[#111827]"
                  } ${isSelected ? "ring-2 ring-indigo-500 ring-inset z-10" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? "bg-indigo-600 text-white font-bold"
                          : isSelected
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cd.dayNumber}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task chips preview */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map(t => (
                      <div
                        key={t.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 ${
                          t.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 line-through dark:bg-emerald-950/50 dark:text-emerald-300"
                            : t.priority === "Critical"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-200"
                        }`}
                      >
                        {t.location && <MapPin size={9} className="flex-shrink-0 text-indigo-500" />}
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] font-semibold text-slate-400 px-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {selectedDate === todayStr ? "Today's Agenda" : "Day Schedule"}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-0.5">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 text-indigo-600 transition-colors"
              title="Add task to this date"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {selectedDayTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarIcon size={32} className="mx-auto mb-2 opacity-30 text-indigo-500" />
                <p className="text-sm font-medium">No tasks scheduled</p>
                <p className="text-xs text-slate-400 mt-1">Tap + above to plan a task for this date.</p>
              </div>
            ) : (
              selectedDayTasks.map(t => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border transition-all ${
                    t.status === "Completed"
                      ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await api.completeTask(t.id);
                            loadTasks();
                          } catch (e: any) {
                            alert(e.message);
                          }
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          t.status === "Completed"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {t.status === "Completed" && <CheckCircle2 size={12} />}
                      </button>
                      <h4 className={`text-sm font-semibold ${t.status === "Completed" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                        {t.title}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityColor[t.priority] || ""}`}>
                      {t.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {t.due_time || "End of day"}
                    </span>
                    {t.category && <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-[11px] font-medium">{t.category}</span>}
                    {t.location && (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                        <MapPin size={12} /> {t.location.label}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleQuickAdd}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Add Task for {selectedDate}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Submit Lab Assignment"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                  >
                    <option>Academic</option>
                    <option>Personal</option>
                    <option>Work</option>
                    <option>Shopping</option>
                    <option>Health</option>
                    <option>Finance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4"
                >
                  Create Task
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
