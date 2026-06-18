"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Spinner } from "@/components/loaders/spinner";

type Priority = "URGENT" | "IMPORTANT" | "NORMAL" | "LOW";

type Email = {
  id: string;
  subject: string;
  sender: string;
  classification: { priority: Priority } | null;
};

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles =
    priority === "URGENT"
      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      : "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";

  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles}`}>
      {priority === "URGENT" ? "Urgent" : "Important"}
    </span>
  );
}

export function ImportantEmails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gmail/important?limit=6")
      .then((r) => r.json())
      .then((j) => { if (j.success) setEmails(j.data.emails); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-ps-text">Important Emails</h2>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      ) : emails.length === 0 ? (
        <p className="py-3 text-center text-xs text-ps-muted">No urgent or important emails</p>
      ) : (
        <div className="space-y-1.5">
          {emails.map((email) => (
            <Link
              key={email.id}
              href={`/inbox/${email.id}`}
              className="group flex items-center gap-3 rounded-xl border border-ps-border p-3 transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-ps-secondary">{email.sender}</p>
                <p className="truncate text-sm text-ps-text">{email.subject}</p>
              </div>
              {email.classification && (
                <PriorityBadge priority={email.classification.priority} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
