export type SyncIntegration = "gmail" | "calendar";

export type SyncStatusValue = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type SyncRecord = {
  id: string;
  userId: string;
  integration: SyncIntegration;
  status: SyncStatusValue;
  progress: number;
  total: number;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
};

export type TriggerSyncResult = {
  status: "started";
  syncRecordId: string;
};

export type SyncStatusResult = {
  gmailStatus: SyncStatusValue | null;
  calendarStatus: SyncStatusValue | null;
};

export type SyncProgressResult = {
  gmailProgress: number;
  gmailTotal: number;
  calendarProgress: number;
  calendarTotal: number;
};
