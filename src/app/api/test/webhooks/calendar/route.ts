/**
 * POST /api/test/webhooks/calendar?tenantId=<clerkUserId>
 *
 * Tests the Calendar webhook DB write path using a mock payload.
 *
 * IMPORTANT: This route bypasses Corsair's processWebhook() signature verification.
 * It directly exercises CalendarRepository.upsertEvent() to verify the DB layer.
 * To test real Corsair webhook delivery, register your tunnel URL in the Corsair dashboard.
 *
 * Body (optional — defaults to mock data):
 *   {
 *     "corsairEventId": "mock_gcal_event_001",
 *     "title": "Test Webhook Event",
 *     "description": "Created via webhook test",
 *     "startTime": "2026-06-15T10:00:00Z",
 *     "endTime": "2026-06-15T11:00:00Z"
 *   }
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/webhooks/calendar?tenantId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{}'
 *
 * Expected:
 *   { "success": true, "data": { "processed": true, "eventId": "...", "corsairEventId": "mock_gcal_event_001" } }
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { WebhookRepository } from "@/modules/webhooks/webhook.repository";
import { CalendarRepository } from "@/modules/calendar";
import { z } from "zod";

const querySchema = z.object({
  tenantId: z.string().min(1, "tenantId required"),
});

const bodySchema = z.object({
  corsairEventId: z.string().default("mock_gcal_event_001"),
  title: z.string().default("Test Webhook Event"),
  description: z.string().optional(),
  startTime: z.string().default(new Date(Date.now() + 86_400_000).toISOString()),
  endTime: z.string().default(new Date(Date.now() + 90_000_000).toISOString()),
  meetingLink: z.string().optional(),
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

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return fail("startTime and endTime must be valid ISO date strings", "VALIDATION_ERROR", 400);
    }

    const calendarRepo = new CalendarRepository(prisma);
    const saved = await calendarRepo.upsertEvent({
      corsairEventId: parsed.data.corsairEventId,
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      startTime,
      endTime,
      meetingLink: parsed.data.meetingLink ?? null,
    });

    return ok({ processed: true, eventId: saved.id, corsairEventId: saved.corsairEventId });
  } catch (error) {
    return fail(String(error), "WEBHOOK_ERROR", 500);
  }
}
