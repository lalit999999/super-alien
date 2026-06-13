/**
 * Test: Get Emails
 * Usage: npx tsx scripts/test-corsair-emails.ts <clerkUserId>
 *
 * Prerequisites:
 *   1. CORSAIR_KEK and DATABASE_URL set in .env
 *   2. corsair-setup.ts has been run
 *   3. The user has completed the OAuth connect flow
 */

import { config } from "dotenv";
config({ path: ".env" });
import { getEmails } from "../src/modules/corsair"
const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npx tsx scripts/test-corsair-emails.ts <clerkUserId>");
  process.exit(1);
}

async function main() {
  console.log(`\n📬 Fetching emails for user: ${userId}\n`);

  const result = await getEmails(userId, {
    maxResults: 5,
    labelIds: ["INBOX"],
  });

  if (!result.messages || result.messages.length === 0) {
    console.log("No emails found. The inbox may be empty or the user has not connected Gmail.");
    return;
  }

  console.log(`✅ Retrieved ${result.messages.length} email(s):\n`);
  for (const msg of result.messages) {
    console.log(`  id: ${msg.id}  threadId: ${msg.threadId}  snippet: ${msg.snippet?.slice(0, 60)}`);
  }

  if (result.nextPageToken) {
    console.log(`\n  (nextPageToken: ${result.nextPageToken})`);
  }
}

main().catch((err) => {
  console.error("❌ Test failed:", err.message ?? err);
  process.exit(1);
});
