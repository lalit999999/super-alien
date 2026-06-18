"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

const newEventSchema = z.object({
  summary: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDateTime: z.string().min(1, "Start time is required"),
  endDateTime: z.string().min(1, "End time is required"),
  timeZone: z.string().min(1),
  attendees: z.array(z.string().email()),
  sendUpdates: z.enum(["all", "externalOnly", "none"]),
}).refine((d) => new Date(d.endDateTime) > new Date(d.startDateTime), {
  message: "End time must be after start time",
  path: ["endDateTime"],
});

type NewEventForm = z.infer<typeof newEventSchema>;

type CreateResponse =
  | { success: true; data: unknown }
  | { success: false; error: string; code: string };

interface NewEventDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function toLocalDateTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewEventDialog({ open, onClose, onCreated }: NewEventDialogProps) {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const [form, setForm] = useState<NewEventForm>({
    summary: "",
    description: "",
    location: "",
    startDateTime: toLocalDateTimeValue(now),
    endDateTime: toLocalDateTimeValue(inOneHour),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    attendees: [],
    sendUpdates: "all",
  });
  const [attendeeInput, setAttendeeInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function update<K extends keyof NewEventForm>(field: K, value: NewEventForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  function addAttendee() {
    const email = attendeeInput.trim();
    if (!email) return;
    const result = z.string().email().safeParse(email);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, attendeeInput: "Invalid email address" }));
      return;
    }
    if (form.attendees.includes(email)) {
      setErrors((prev) => ({ ...prev, attendeeInput: "Already added" }));
      return;
    }
    setForm((prev) => ({ ...prev, attendees: [...prev.attendees, email] }));
    setAttendeeInput("");
    setErrors((prev) => ({ ...prev, attendeeInput: undefined }));
  }

  function removeAttendee(email: string) {
    setForm((prev) => ({ ...prev, attendees: prev.attendees.filter((a) => a !== email) }));
  }

  function validate(): boolean {
    const result = newEventSchema.safeParse(form);
    if (result.success) { setErrors({}); return true; }
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        summary: form.summary,
        ...(form.description && { description: form.description }),
        ...(form.location && { location: form.location }),
        start: { dateTime: new Date(form.startDateTime).toISOString(), timeZone: form.timeZone },
        end: { dateTime: new Date(form.endDateTime).toISOString(), timeZone: form.timeZone },
        ...(form.attendees.length > 0 && { attendees: form.attendees.map((email) => ({ email })) }),
        sendUpdates: form.sendUpdates,
      };

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: CreateResponse = await res.json();
      if (!json.success) {
        setServerError(json.error);
        return;
      }
      onCreated();
      handleClose();
    } catch {
      setServerError("Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({
      summary: "",
      description: "",
      location: "",
      startDateTime: toLocalDateTimeValue(now),
      endDateTime: toLocalDateTimeValue(inOneHour),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attendees: [],
      sendUpdates: "all",
    });
    setAttendeeInput("");
    setErrors({});
    setServerError(null);
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none transition-colors focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-ps-card border-ps-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-ps-text">New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ps-secondary">Title *</label>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="Event title"
              className={inputClass}
            />
            {errors.summary && <p className="text-xs text-red-500">{errors.summary}</p>}
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ps-secondary">Start *</label>
              <input
                type="datetime-local"
                value={form.startDateTime}
                onChange={(e) => update("startDateTime", e.target.value)}
                className={inputClass}
              />
              {errors.startDateTime && <p className="text-xs text-red-500">{errors.startDateTime}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ps-secondary">End *</label>
              <input
                type="datetime-local"
                value={form.endDateTime}
                onChange={(e) => update("endDateTime", e.target.value)}
                className={inputClass}
              />
              {errors.endDateTime && <p className="text-xs text-red-500">{errors.endDateTime}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ps-secondary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ps-secondary">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Add location or meeting link"
              className={inputClass}
            />
          </div>

          {/* Attendees */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ps-secondary">Attendees</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={attendeeInput}
                onChange={(e) => { setAttendeeInput(e.target.value); setErrors((prev) => ({ ...prev, attendeeInput: undefined })); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }}
                placeholder="attendee@example.com"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={addAttendee}
                className="flex items-center gap-1 rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {errors.attendeeInput && <p className="text-xs text-red-500">{errors.attendeeInput}</p>}
            {form.attendees.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {form.attendees.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1 rounded-full border border-ps-border bg-ps-surface px-2.5 py-0.5 text-xs text-ps-secondary"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeAttendee(email)}
                      className="ml-0.5 rounded-full text-ps-muted hover:text-ps-text"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Send updates */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-ps-secondary">Notify attendees</label>
            <select
              value={form.sendUpdates}
              onChange={(e) => update("sendUpdates", e.target.value as NewEventForm["sendUpdates"])}
              className={inputClass}
            >
              <option value="all">All attendees</option>
              <option value="externalOnly">External attendees only</option>
              <option value="none">No notifications</option>
            </select>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
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
              {submitting ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
