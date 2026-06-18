"use client";

import { useEffect } from "react";

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

type Integration = "gmail" | "calendar" | "both";

export function useAutoSync(integration: Integration) {
  useEffect(() => {
    async function checkAndSync() {
      try {
        const res = await fetch("/api/integrations/status");
        if (!res.ok) return;
        const json = await res.json() as {
          success: boolean;
          data: { lastGmailSync: string | null; lastCalendarSync: string | null };
        };
        if (!json.success) return;

        const now = Date.now();
        const { lastGmailSync, lastCalendarSync } = json.data;

        const gmailStale =
          !lastGmailSync ||
          now - new Date(lastGmailSync).getTime() > STALE_THRESHOLD_MS;

        const calendarStale =
          !lastCalendarSync ||
          now - new Date(lastCalendarSync).getTime() > STALE_THRESHOLD_MS;

        const shouldSyncGmail =
          (integration === "gmail" || integration === "both") && gmailStale;

        const shouldSyncCalendar =
          (integration === "calendar" || integration === "both") && calendarStale;

        if (shouldSyncGmail) {
          fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ integration: "gmail" }),
          }).catch(() => undefined);
        }

        if (shouldSyncCalendar) {
          fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ integration: "calendar" }),
          }).catch(() => undefined);
        }
      } catch {
        // best-effort background sync — ignore errors
      }
    }

    checkAndSync();
  }, [integration]);
}
