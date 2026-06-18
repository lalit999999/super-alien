import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimitService } from "@/modules/rate-limit";
import { getRateLimitHeaders } from "@/modules/rate-limit";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/config/generated/prisma/client";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/corsair(.*)",
  "/api/test-auth(.*)",
  "/api/test(.*)",
  "/api/billing/subscribe",
]);

const isRateLimitedApiRoute = createRouteMatcher([
  "/api/chat(.*)",
  "/api/gmail(.*)",
  "/api/calendar(.*)",
  "/api/agent(.*)",
]);

async function hasActiveSubscription(clerkUserId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!user) return false;

    const sub = await prisma.subscription.findFirst({
      where: { userId: user.id, status: SubscriptionStatus.ACTIVE },
      select: { id: true },
    });
    return sub !== null;
  } catch {
    return false;
  }
}

export default clerkMiddleware(async (auth, request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (isRateLimitedApiRoute(request)) {
    const { userId } = await auth();
    if (userId) {
      const active = await hasActiveSubscription(userId);
      if (!active) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "An active subscription is required.",
            code: "SUBSCRIPTION_REQUIRED",
          }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await rateLimitService.checkApi(userId);
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: "Too many requests. Please slow down.",
            code: "RATE_LIMIT_EXCEEDED",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...getRateLimitHeaders(result.limit, result.remaining, result.resetAt),
            },
          }
        );
      }
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
