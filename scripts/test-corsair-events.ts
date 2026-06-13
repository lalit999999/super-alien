/**
 * Test: Get Calendar Events
 * Usage: npx tsx scripts/test-corsair-events.ts <clerkUserId>
 *
 * Fetches the next 5 upcoming events from the user's primary Google Calendar.
 */

import "dotenv/config";
import { getEvents } from "../src/modules/corsair";

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npx tsx scripts/test-corsair-events.ts <clerkUserId>");
  process.exit(1);
}

async function main() {
  const now = new Date().toISOString();

  console.log(`\n📅 Fetching calendar events for user: ${userId}\n`);

  const result = await getEvents(userId, {
    timeMin: now,
    maxResults: 5,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = (result as { items?: unknown[] }).items;

  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return;
  }

  console.log(`✅ Retrieved ${events.length} event(s):\n`);
  for (const evt of events as Array<Record<string, unknown>>) {
    const start = (evt.start as Record<string, string>)?.dateTime ?? (evt.start as Record<string, string>)?.date;
    console.log(`  [${start}] ${evt.summary ?? "(no title)"}  id: ${evt.id}`);
  }
}

main().catch((err) => {
  console.error("❌ Test failed:", err.message ?? err);
  process.exit(1);
});
