export type DashboardCalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees?: { email?: string; displayName?: string }[] | null;
  isAllDay?: boolean;
};
