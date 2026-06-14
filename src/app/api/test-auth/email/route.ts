import { auth } from "@clerk/nextjs/server";
import { getEmails, sendEmail } from "@/modules/corsair";
import { sendEmailBodySchema } from "@/modules/gmail/gmail.schema";

async function resolveUserId(req: Request): Promise<string | null> {
  const { userId } = await auth();
  if (userId) return userId;
  // fallback for curl testing — pass ?userId=user_xxx
  return new URL(req.url).searchParams.get("userId");
}

// GET /api/test-auth/email?userId=user_xxx — list inbox emails
export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return Response.json({ ok: false, error: "userId required" }, { status: 401 });

    const result = await getEmails(userId, { labelIds: ["INBOX"], maxResults: 5 });

    return Response.json({
      ok: true,
      userId,
      count: result.messages?.length ?? 0,
      messages: result.messages ?? [],
    });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/test-auth/email?userId=user_xxx
// Body: { to, subject, body, threadId? }
export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return Response.json({ ok: false, error: "userId required" }, { status: 401 });

    const json = await req.json();
    const parsed = sendEmailBodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ ok: false, error: parsed.error.issues }, { status: 400 });
    }

    const result = await sendEmail(userId, parsed.data);

    return Response.json({ ok: true, userId, result });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
