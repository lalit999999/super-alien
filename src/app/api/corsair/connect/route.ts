import { generateOAuthUrl } from "corsair/oauth";
import { requireAuth } from "@/lib/auth";
import { corsairInstance } from "@/modules/corsair/corsair.client";
import { env } from "@/config/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/corsair/callback`;

// GET /api/corsair/connect?plugin=gmail
// GET /api/corsair/connect?plugin=googlecalendar
//
// Redirects the logged-in user to the Google OAuth consent screen.
// After the user grants access, Google redirects to /api/corsair/callback.
export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth();

    const { searchParams } = new URL(req.url);
    const plugin = searchParams.get("plugin");

    if (!plugin || !["gmail", "googlecalendar"].includes(plugin)) {
      return Response.json(
        { ok: false, error: 'Missing or invalid ?plugin=. Use "gmail" or "googlecalendar".' },
        { status: 400 }
      );
    }

    const { url } = await generateOAuthUrl(corsairInstance, plugin, {
      tenantId: userId,
      redirectUri: REDIRECT_URI,
    });

    return Response.redirect(url);
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
