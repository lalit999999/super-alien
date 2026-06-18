"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Paperclip } from "lucide-react";

const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20 MB client-side cap

type Attachment = {
  filename: string;
  mimeType: string;
  data: string; // base64, no data: prefix
  size: number;
};

type SendResponse =
  | { success: true; data: unknown }
  | { success: false; error: string; code: string };

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  threadId?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComposeModal({ open, onClose, defaultTo = "", threadId }: ComposeModalProps) {
  const { user } = useUser();
  const from = user?.primaryEmailAddress?.emailAddress ?? "";

  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);

  const [toError, setToError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setTo(defaultTo);
    setSubject("");
    setBody("");
    setAttachments([]);
    setAttachError(null);
    setToError(null);
    setSubjectError(null);
    setBodyError(null);
    setServerError(null);
    setSent(false);
    onClose();
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAttachError(null);

    const currentTotal = attachments.reduce((s, a) => s + a.size, 0);
    let runningTotal = currentTotal;

    const readers: Promise<Attachment>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      runningTotal += file.size;
      if (runningTotal > MAX_TOTAL_BYTES) {
        setAttachError("Total attachments exceed 20 MB limit");
        return;
      }
      readers.push(
        new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1] ?? result;
            resolve({ filename: file.name, mimeType: file.type || "application/octet-stream", data: base64, size: file.size });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(readers)
      .then((newAtts) => setAttachments((prev) => [...prev, ...newAtts]))
      .catch(() => setAttachError("Failed to read one or more files"));
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachError(null);
  }

  function validate(): boolean {
    let valid = true;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to.trim() || !emailRe.test(to.trim())) {
      setToError("Valid recipient email is required");
      valid = false;
    } else {
      setToError(null);
    }
    if (!subject.trim()) {
      setSubjectError("Subject is required");
      valid = false;
    } else {
      setSubjectError(null);
    }
    if (!body.trim()) {
      setBodyError("Message body is required");
      valid = false;
    } else {
      setBodyError(null);
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    setServerError(null);
    try {
      const payload: Record<string, unknown> = { to: to.trim(), subject: subject.trim(), body: body.trim() };
      if (threadId) payload.threadId = threadId;
      if (attachments.length > 0) {
        payload.attachments = attachments.map(({ filename, mimeType, data }) => ({ filename, mimeType, data }));
      }

      const res = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: SendResponse = await res.json();
      if (!json.success) { setServerError(json.error); return; }
      setSent(true);
    } catch {
      setServerError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const fieldClass =
    "w-full bg-transparent text-sm text-ps-text placeholder:text-ps-muted outline-none";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 bg-ps-card border-ps-border overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-ps-surface-2 px-4 py-2.5">
          <span className="text-sm font-semibold text-ps-text">
            {threadId ? "Reply" : "New Message"}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-ps-muted transition-colors hover:bg-ps-border hover:text-ps-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-ps-text">Sent</p>
              <p className="mt-0.5 text-sm text-ps-secondary">Email delivered to {to}</p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 rounded-lg bg-ps-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ps-accent-dark"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Fields */}
            <div className="divide-y divide-ps-border border-b border-ps-border">
              {/* From (read-only) */}
              <div className="flex items-center gap-2 px-4 py-2.5">
                <span className="w-14 shrink-0 text-xs font-medium text-ps-muted">From</span>
                <span className="text-sm text-ps-secondary">{from || "Loading…"}</span>
              </div>

              {/* To */}
              <div className="flex items-center gap-2 px-4 py-2.5">
                <label htmlFor="compose-to" className="w-14 shrink-0 text-xs font-medium text-ps-muted">To</label>
                <input
                  id="compose-to"
                  type="email"
                  value={to}
                  onChange={(e) => { setTo(e.target.value); setToError(null); }}
                  placeholder="recipient@example.com"
                  className={fieldClass}
                />
              </div>
              {toError && <p className="px-4 pb-1 text-xs text-red-500">{toError}</p>}

              {/* Subject */}
              <div className="flex items-center gap-2 px-4 py-2.5">
                <label htmlFor="compose-subject" className="w-14 shrink-0 text-xs font-medium text-ps-muted">Subject</label>
                <input
                  id="compose-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setSubjectError(null); }}
                  placeholder="Subject"
                  className={fieldClass}
                />
              </div>
              {subjectError && <p className="px-4 pb-1 text-xs text-red-500">{subjectError}</p>}
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setBodyError(null); }}
              placeholder="Write your message…"
              rows={9}
              className="resize-none bg-transparent px-4 py-3 text-sm text-ps-text placeholder:text-ps-muted outline-none"
            />
            {bodyError && <p className="px-4 pb-1 text-xs text-red-500">{bodyError}</p>}

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-ps-border px-4 py-2">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-full border border-ps-border bg-ps-surface px-2.5 py-0.5 text-xs text-ps-secondary"
                  >
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="max-w-32 truncate">{att.filename}</span>
                    <span className="text-ps-muted">({formatBytes(att.size)})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="ml-0.5 rounded-full text-ps-muted hover:text-ps-text"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Errors */}
            {(attachError || serverError) && (
              <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                {attachError ?? serverError}
              </div>
            )}

            {/* Footer bar */}
            <div className="flex items-center justify-between border-t border-ps-border px-4 py-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg p-1.5 text-ps-muted transition-colors hover:bg-ps-surface hover:text-ps-text"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-lg bg-ps-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
