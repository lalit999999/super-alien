/**
 * Test: Create Calendar Event
 * Usage: npx tsx scripts/test-corsair-create-event.ts <clerkUserId>
 *
 * Creates a 30-minute test event starting 1 hour from now.
 */

import { config } from "dotenv";
config({ path: ".env" });
import { createEvent } from "../src/modules/corsair";

const userId = process.argv[2];

if (!userId) {
  console.error(
    "Usage: npx tsx scripts/test-corsair-create-event.ts <clerkUserId>"
  );
  process.exit(1);
}

async function main() {
  const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min duration

  console.log(`\n📅 Creating test calendar event for user: ${userId}`);
  console.log(`   Start: ${startTime.toISOString()}`);
  console.log(`   End  : ${endTime.toISOString()}\n`);

  const result = await createEvent(userId, {
    event: {
      summary: "SuperAlien Test Event",
      description: `Created by the SuperAlien Corsair integration test on ${new Date().toISOString()}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
    },
    sendUpdates: "none",
  });

  console.log(`✅ Event created successfully!`);
  console.log(`   Event ID  : ${(result as Record<string, unknown>).id}`);
  console.log(`   Title     : ${(result as Record<string, unknown>).summary}`);
  console.log(`   HTML link : ${(result as Record<string, unknown>).htmlLink ?? "(n/a)"}`);
}

main().catch((err) => {
  console.error("❌ Test failed:", err.message ?? err);
  process.exit(1);
});
