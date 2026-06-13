/**
 * Test: Send Email
 * Usage: npx tsx scripts/test-corsair-send.ts <clerkUserId> <to> <subject>
 *
 * Example:
 *   npx tsx scripts/test-corsair-send.ts user_abc test@example.com "Hello from SuperAlien"
 */

import { config } from "dotenv";
config({ path: ".env" });
import { sendEmail } from "../src/modules/corsair";

const [userId, to, subject] = process.argv.slice(2);

if (!userId || !to || !subject) {
  console.error(
    "Usage: npx tsx scripts/test-corsair-send.ts <clerkUserId> <to> <subject>"
  );
  process.exit(1);
}

async function main() {
  console.log(`\n📤 Sending email via Corsair...`);
  console.log(`   From (user): ${userId}`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}\n`);

  const result = await sendEmail(userId, {
    to,
    subject,
    body: `This is a test email sent from SuperAlien via Corsair.\n\nTimestamp: ${new Date().toISOString()}`,
  });

  console.log(`✅ Email sent successfully!`);
  console.log(`   Message ID : ${result.id}`);
  console.log(`   Thread ID  : ${result.threadId}`);
}

main().catch((err) => {
  console.error("❌ Test failed:", err.message ?? err);
  process.exit(1);
});
