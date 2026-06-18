"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  priority: TaskPriority;
  completedAt: string | null;
};

function priorityDot(priority: TaskPriority) {
  const colors = { HIGH: "bg-red-500", MEDIUM: "bg-amber-500", LOW: "bg-ps-muted" };
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[priority]}`}
      title={priority}
    />
  );
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date();
}

function isDueToday(task: Task): boolean {
  if (!task.dueDate || task.completed) return false;
  const d = new Date(task.dueDate);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIUM");
  const [completedOpen, setCompletedOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((j) => { if (j.success) setTasks(j.data.tasks); })
      .catch(() => {});
  }, []);

  async function addTask() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), priority: newPriority }),
      });
      const j = await res.json();
      if (j.success) {
        setTasks((prev) => [j.data.task, ...prev]);
        setNewTitle("");
        inputRef.current?.focus();
      }
    } finally {
      setAdding(false);
    }
  }

  async function toggleTask(task: Task) {
    const optimistic = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const j = await res.json();
    if (j.success) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? j.data.task : t)));
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-ps-text">Todo List</h2>

      {/* Add task */}
      <div className="mb-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          className="rounded-lg border border-ps-border bg-ps-bg px-2 py-2 text-xs text-ps-secondary outline-none focus:border-ps-accent"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <button
          onClick={addTask}
          disabled={adding || !newTitle.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-ps-accent text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Incomplete tasks */}
      <div className="space-y-1.5">
        {incomplete.length === 0 && (
          <p className="py-3 text-center text-xs text-ps-muted">No pending tasks</p>
        )}
        {incomplete.map((task) => {
          const overdue = isOverdue(task);
          const dueToday = isDueToday(task);
          return (
            <div
              key={task.id}
              className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                overdue
                  ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10"
                  : dueToday
                  ? "border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-900/10"
                  : "border-ps-border bg-ps-bg"
              }`}
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggleTask(task)}
                className="h-4 w-4 shrink-0 cursor-pointer rounded border-ps-border text-ps-accent accent-ps-accent"
              />
              {priorityDot(task.priority)}
              <span className="flex-1 min-w-0 text-sm text-ps-text truncate">{task.title}</span>
              {overdue && (
                <span className="shrink-0 text-[10px] font-medium text-red-500">Overdue</span>
              )}
              {!overdue && dueToday && (
                <span className="shrink-0 text-[10px] font-medium text-orange-500">Today</span>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-ps-muted transition-opacity hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setCompletedOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-ps-muted transition-colors hover:text-ps-secondary"
          >
            {completedOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Completed ({completed.length})
          </button>
          {completedOpen && (
            <div className="mt-1.5 space-y-1.5">
              {completed.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-2.5 rounded-xl border border-ps-border bg-ps-bg px-3 py-2.5 opacity-60"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleTask(task)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded accent-ps-accent"
                  />
                  {priorityDot(task.priority)}
                  <span className="flex-1 min-w-0 text-sm text-ps-muted line-through truncate">
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-ps-muted transition-opacity hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
