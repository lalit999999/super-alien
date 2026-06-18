"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const composeSchema = z.object({
  to: z.string().email({ message: "Invalid recipient email address" }),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  threadId: z.string().optional(),
});

type ComposeForm = z.infer<typeof composeSchema>;

type SendResponse =
  | { success: true; data: unknown }
  | { success: false; error: string; code: string };

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  threadId?: string;
}

export function ComposeModal({ open, onClose, defaultTo = "", threadId }: ComposeModalProps) {
  const [form, setForm] = useState<ComposeForm>({
    to: defaultTo,
    subject: "",
    body: "",
    threadId,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ComposeForm, string>>>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update(field: keyof ComposeForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  function validate(): boolean {
    const result = composeSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: Partial<Record<keyof ComposeForm, string>> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof ComposeForm;
      fieldErrors[field] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    setServerError(null);
    try {
      const payload: Record<string, string> = {
        to: form.to,
        subject: form.subject,
        body: form.body,
      };
      if (form.threadId) payload.threadId = form.threadId;

      const res = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: SendResponse = await res.json();
      if (!json.success) {
        setServerError(json.error);
        return;
      }
      setSent(true);
    } catch {
      setServerError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setForm({ to: defaultTo, subject: "", body: "", threadId });
    setErrors({});
    setServerError(null);
    setSent(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-ps-card border-ps-border">
        <DialogHeader>
          <DialogTitle className="text-ps-text">
            {threadId ? "Reply" : "New Message"}
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-ps-text">Sent</p>
              <p className="mt-0.5 text-sm text-ps-secondary">Email delivered to {form.to}</p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 rounded-lg bg-ps-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ps-accent-dark"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ps-secondary">To</label>
              <input
                type="email"
                value={form.to}
                onChange={(e) => update("to", e.target.value)}
                placeholder="recipient@example.com"
                className="rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none transition-colors focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10"
              />
              {errors.to && <p className="text-xs text-red-500">{errors.to}</p>}
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ps-secondary">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="Subject"
                className="rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none transition-colors focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10"
              />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ps-secondary">Message</label>
              <textarea
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Write your message..."
                rows={8}
                className="rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none transition-colors focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10 resize-none"
              />
              {errors.body && <p className="text-xs text-red-500">{errors.body}</p>}
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
                disabled={sending}
                className="rounded-lg bg-ps-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
