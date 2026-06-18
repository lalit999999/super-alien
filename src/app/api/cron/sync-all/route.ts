import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GmailRepository, GmailService } from "@/modules/gmail";
import { CalendarRepository, CalendarService } from "@/modules/calendar";
import { OnboardingRepository } from "@/modules/onboarding/onboarding.repository";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { gmailConnected: true },
        { calendarConnected: true },
      ],
    },
    select: {
      id: true,
      clerkUserId: true,
      gmailConnected: true,
      calendarConnected: true,
    },
  });

  const gmailRepo = new GmailRepository(prisma);
  const gmailService = new GmailService(gmailRepo);
  const calendarRepo = new CalendarRepository(prisma);
  const calendarService = new CalendarService(calendarRepo);
  const onboardingRepo = new OnboardingRepository(prisma);

  const results: { userId: string; gmail?: string; calendar?: string }[] = [];

  for (const user of users) {
    const result: { userId: string; gmail?: string; calendar?: string } = {
      userId: user.id,
    };

    try {
      if (user.gmailConnected) {
        await gmailService.syncEmailsFromCorsair(user.clerkUserId);
        await onboardingRepo.updateLastGmailSync(user.clerkUserId, new Date());
        result.gmail = "ok";
      }
    } catch (err) {
      result.gmail = `error: ${err instanceof Error ? err.message : String(err)}`;
    }

    try {
      if (user.calendarConnected) {
        await calendarService.syncEventsFromCorsair(user.clerkUserId, user.id);
        await onboardingRepo.updateLastCalendarSync(user.clerkUserId, new Date());
        result.calendar = "ok";
      }
    } catch (err) {
      result.calendar = `error: ${err instanceof Error ? err.message : String(err)}`;
    }

    results.push(result);
  }

  return NextResponse.json({ synced: results.length, results });
}
