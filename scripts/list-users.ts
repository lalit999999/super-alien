/**
 * List all Clerk users with their IDs and emails.
 * Usage: npx tsx scripts/list-users.ts
 *
 * Optional flags:
 *   --limit=<n>    Number of users to fetch (default: 50)
 *   --query=<str>  Filter by email/name (e.g. --query=john)
 */

import { config } from "dotenv";
config({ path: ".env" });

import { createClerkClient } from "@clerk/nextjs/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const queryArg = args.find((a) => a.startsWith("--query="));

const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;
const query = queryArg ? queryArg.split("=")[1] : undefined;

export async function listalluser() {
  console.log("\n👥 Fetching Clerk users...\n");

  const response = await clerkClient.users.getUserList({
    limit,
    query,
  });

  const users = response.data;

  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);
  console.log(users);

  return users;
}

listalluser().catch((err) => {
  console.error("❌ Failed:", err.message ?? err);
  process.exit(1);
});
