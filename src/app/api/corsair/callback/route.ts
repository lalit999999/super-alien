import { processOAuthCallback } from "corsair/oauth";
import { corsairInstance } from "@/modules/corsair/corsair.client";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { OnboardingRepository } from "@/modules/onboarding/onboarding.repository";
import { OnboardingService } from "@/modules/onboarding/onboarding.service";

const APP_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/corsair/callback`;

// GET /api/corsair/callback?code=...&state=...
//
// Google redirects here after the user grants OAuth access.
// Corsair exchanges the code for tokens and stores them encrypted in the DB.
// On success, updates integration flags and redirects to /onboarding.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return Response.json(
        { ok: false, error: "Missing code or state from OAuth provider." },
        { status: 400 }
      );
    }

    const result = await processOAuthCallback(corsairInstance, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    const repo = new OnboardingRepository(prisma);
    const service = new OnboardingService(repo);

    if (result.plugin === "gmail") {
      await service.markGmailConnected(result.tenantId);
    } else if (result.plugin === "googlecalendar") {
      await service.markCalendarConnected(result.tenantId);
    }

    return Response.redirect(`${APP_URL}/onboarding?connected=${result.plugin}`);
  } catch (error) {
    return Response.redirect(`${APP_URL}/onboarding?error=connection_failed`);
  }
}
