import type { PrismaClient } from "@/config/generated/prisma/client";

export class DashboardService {
  constructor(private readonly db: PrismaClient) {}

  async getDashboardStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [unreadCount, importantCount, meetingsToday, upcomingEvents] =
      await Promise.all([
        this.db.email.count({
          where: { userId, isRead: false },
        }),
        this.db.email.count({
          where: {
            userId,
            classification: { priority: { in: ["URGENT", "IMPORTANT"] } },
          },
        }),
        this.db.calendarEvent.count({
          where: {
            userId,
            startTime: { gte: today, lt: tomorrow },
          },
        }),
        this.db.calendarEvent.count({
          where: {
            userId,
            startTime: {
              gte: tomorrow,
              lt: new Date(tomorrow.getTime() + 6 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    return { unreadCount, importantCount, meetingsToday, upcomingEvents };
  }
}
