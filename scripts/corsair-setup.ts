/**
 * One-time setup script for Corsair.
 *
 * Responsibilities:
 *   1. Creates Corsair's required tables in the database (corsair_integrations,
 *      corsair_accounts, corsair_entities, corsair_events, corsair_permissions).
 *   2. Stores the Google OAuth2 client_id and client_secret in the database
 *      (encrypted with CORSAIR_KEK).
 *   3. Sets the Gmail Pub/Sub topic_id for push notifications.
 *
 * Run once after initial deploy or after resetting the database:
 *   npx tsx scripts/corsair-setup.ts
 *
 * To set credentials non-interactively pass them as flags:
 *   npx tsx scripts/corsair-setup.ts \
 *     --gmail.client_id=YOUR_ID \
 *     --gmail.client_secret=YOUR_SECRET \
 *     --googlecalendar.client_id=YOUR_ID \
 *     --googlecalendar.client_secret=YOUR_SECRET
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { setupCorsair } from "corsair";
import { corsairInstance } from "../src/modules/corsair/corsair.client";

async function main() {
  console.log("🚀 Setting up Corsair...\n");

  const args = process.argv.slice(2);

  // Parse --plugin.field=value flags
  const credentials: Record<string, Record<string, string>> = {};
  for (const arg of args) {
    const match = arg.match(/^--(\w+)\.(\w+)=(.+)$/);
    if (match) {
      const [, plugin, field, value] = match;
      credentials[plugin] ??= {};
      credentials[plugin][field] = value;
    }
  }

  const output = await setupCorsair(corsairInstance, {
    backfill: false,
    caller: "cli",
    ...(Object.keys(credentials).length > 0 ? { credentials } : {}),
  });

  console.log(output);
  console.log("\n✅ Corsair setup complete.");
  console.log(
    "\nNext steps:"
  );
  console.log(
    "  1. Set Google OAuth credentials if not passed as flags:"
  );
  console.log(
    "       npx tsx scripts/corsair-setup.ts \\"
  );
  console.log(
    "         --gmail.client_id=<id> --gmail.client_secret=<secret> \\"
  );
  console.log(
    "         --googlecalendar.client_id=<id> --googlecalendar.client_secret=<secret>"
  );
  console.log(
    "  2. Share the Corsair OAuth connect link with users to authorise Gmail/Calendar access."
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Corsair setup failed:", err);
  process.exit(1);
});
