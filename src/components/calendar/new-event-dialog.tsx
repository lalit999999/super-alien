"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Check } from "lucide-react";

// Google Calendar color palette
const CALENDAR_COLORS = [
  { id: "1",  label: "Lavender",  hex: "#7986CB" },
  { id: "2",  label: "Sage",      hex: "#33B679" },
  { id: "3",  label: "Grape",     hex: "#8E24AA" },
  { id: "4",  label: "Flamingo",  hex: "#E67C73" },
  { id: "5",  label: "Banana",    hex: "#F6BF26" },
  { id: "6",  label: "Tangerine", hex: "#F4511E" },
  { id: "7",  label: "Peacock",   hex: "#039BE5" },
  { id: "8",  label: "Graphite",  hex: "#616161" },
  { id: "9",  label: "Blueberry", hex: "#3F51B5" },
  { id: "10", label: "Basil",     hex: "#0B8043" },
  { id: "11", label: "Tomato",    hex: "#D50000" },
] as const;

type CreateResponse =
  | { success: true; data: unknown }
  | { success: false; error: string; code: string };

interface NewEventDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDateTimeValue(d: Date): string {
  return `${toDateValue(d)}T${toTimeValue(d)}`;
}

function nextDayDateValue(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return toDateValue(d);
}

export function NewEventDialog({ open, onClose, onCreated }: NewEventDialogProps) {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(toDateValue(now));
  const [endDate, setEndDate] = useState(toDateValue(now));
  const [startTime, setStartTime] = useState(toTimeValue(now));
  const [endTime, setEndTime] = useState(toTimeValue(inOneHour));
  const [colorId, setColorId] = useState("7");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function reset() {
    const n = new Date();
    const n1h = new Date(n.getTime() + 60 * 60 * 1000);
    setTitle("");
    setDescription("");
    setIsAllDay(false);
    setStartDate(toDateValue(n));
    setEndDate(toDateValue(n));
    setStartTime(toTimeValue(n));
    setEndTime(toTimeValue(n1h));
    setColorId("7");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }

    setSubmitting(true);
    setError(null);
    try {
      let start: Record<string, string>;
      let end: Record<string, string>;

      if (isAllDay) {
        start = { date: startDate };
        end = { date: nextDayDateValue(endDate || startDate) };
      } else {
        start = { dateTime: new Date(toLocalDateTimeValue(new Date(`${startDate}T${startTime}`))).toISOString(), timeZone };
        end = { dateTime: new Date(toLocalDateTimeValue(new Date(`${endDate}T${endTime}`))).toISOString(), timeZone };
        if (new Date(end.dateTime) <= new Date(start.dateTime)) {
          setError("End time must be after start time");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        summary: title.trim(),
        ...(description.trim() && { description: description.trim() }),
        start,
        end,
        colorId,
      };

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: CreateResponse = await res.json();
      if (!json.success) { setError(json.error); return; }
      onCreated();
      handleClose();
    } catch {
      setError("Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none transition-colors focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 bg-ps-card border-ps-border overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-ps-border px-4 py-3">
          <span className="text-sm font-semibold text-ps-text">New event</span>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-ps-muted transition-colors hover:bg-ps-surface hover:text-ps-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          {/* Title — large, borderless */}
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null); }}
            placeholder="Add title"
            className="w-full border-0 bg-transparent text-xl font-medium text-ps-text placeholder:text-ps-muted outline-none"
          />

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-ps-secondary">All day</span>
            <button
              type="button"
              role="switch"
              aria-checked={isAllDay}
              onClick={() => setIsAllDay((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                isAllDay ? "bg-ps-accent" : "bg-ps-border"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  isAllDay ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Date / time pickers */}
          {isAllDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ps-muted">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ps-muted">End date</label>
                <input
                  type="date"
                  value={endDate || startDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ps-muted">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputClass} mb-1`}
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ps-muted">End</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClass} mb-1`}
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description"
            rows={3}
            className={`${inputClass} w-full resize-none`}
          />

          {/* Color swatches */}
          <div>
            <p className="mb-2 text-xs text-ps-muted">Color</p>
            <div className="flex flex-wrap gap-2">
              {CALENDAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setColorId(c.id)}
                  className="relative flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ backgroundColor: c.hex, boxShadow: colorId === c.id ? `0 0 0 2px white, 0 0 0 4px ${c.hex}` : undefined }}
                >
                  {colorId === c.id && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-ps-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
