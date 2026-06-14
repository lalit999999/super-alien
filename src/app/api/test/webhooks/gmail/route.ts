/**
 * POST /api/test/webhooks/gmail?tenantId=<clerkUserId>
 *
 * Tests the Gmail webhook DB write path using a mock payload.
 *
 * IMPORTANT: This route bypasses Corsair's processWebhook() signature verification
 * because test environments do not have valid Corsair webhook signatures.
 * It directly exercises GmailRepository.upsertEmail() to verify the DB layer.
 * To test real Corsair webhook delivery, register your tunnel URL in the Corsair dashboard.
 *
 * Body (optional — defaults to mock data):
 *   {
 *     "corsairEmailId": "mock_gmail_msg_001",
 *     "subject": "Test Webhook Email",
 *     "sender": "sender@example.com",
 *     "snippet": "This is a test snippet",
 *     "body": "Full body text"
 *   }
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/webhooks/gmail?tenantId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{}'
 *
 * Expected:
 *   { "success": true, "data": { "processed": true, "emailId": "...", "corsairEmailId": "mock_gmail_msg_001" } }
 *
 * Verification checklist:
 *   1. DB row created/updated in Email table
 *   2. Re-running with same corsairEmailId should upsert, not duplicate
 *   3. Check DB: SELECT * FROM "Email" WHERE "corsairEmailId" = 'mock_gmail_msg_001'
 *
 * Failures:
 *   - tenantId missing → TENANT_MISSING
 *   - tenantId not in DB → USER_NOT_FOUND
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { WebhookRepository } from "@/modules/webhooks/webhook.repository";
import { GmailRepository } from "@/modules/gmail";
import { z } from "zod";

const querySchema = z.object({
  tenantId: z.string().min(1, "tenantId required"),
});

const bodySchema = z.object({
  corsairEmailId: z.string().default("mock_gmail_msg_001"),
  subject: z.string().default("Test Webhook Email"),
  sender: z.string().default("sender@example.com"),
  snippet: z.string().optional(),
  body: z.string().optional(),
  threadId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParsed = querySchema.safeParse({ tenantId: searchParams.get("tenantId") });
    if (!queryParsed.success) {
      return fail("tenantId query param required", "TENANT_MISSING", 400);
    }

    const webhookRepo = new WebhookRepository(prisma);
    const user = await webhookRepo.findUserByClerkId(queryParsed.data.tenantId);
    if (!user) {
      return fail("User not found for tenantId", "USER_NOT_FOUND", 404);
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR", 400);
    }

    const gmailRepo = new GmailRepository(prisma);
    const saved = await gmailRepo.upsertEmail({
      corsairEmailId: parsed.data.corsairEmailId,
      clerkUserId: queryParsed.data.tenantId,
      threadId: parsed.data.threadId ?? null,
      subject: parsed.data.subject,
      sender: parsed.data.sender,
      snippet: parsed.data.snippet ?? null,
      body: parsed.data.body ?? null,
      receivedAt: new Date(),
    });

    return ok({ processed: true, emailId: saved.id, corsairEmailId: saved.corsairEmailId });
  } catch (error) {
    return fail(String(error), "WEBHOOK_ERROR", 500);
  }
}
