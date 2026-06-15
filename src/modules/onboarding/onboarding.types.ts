export type IntegrationStatus = {
  gmailConnected: boolean;
  calendarConnected: boolean;
  gmailConnectedAt: Date | null;
  calendarConnectedAt: Date | null;
  lastGmailSync: Date | null;
  lastCalendarSync: Date | null;
  onboardingCompleted: boolean;
};

export type DisconnectPlugin = "gmail" | "calendar" | "all";

export type IntegrationSyncResult = {
  gmail: { synced: number; skipped: number } | null;
  calendar: { synced: number; skipped: number } | null;
};
