import { requireAuth } from "@/lib/auth";
import { getEmails, sendEmail } from "@/modules/corsair";
import { sendEmailBodySchema } from "@/modules/gmail/gmail.schema";

// GET /api/test-auth/email — list inbox emails
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const result = await getEmails(userId, {
      labelIds: ["INBOX"],
      maxResults: 5,
    });

    return Response.json({
      ok: true,
      userId,
      count: result.messages?.length ?? 0,
      messages: result.messages ?? [],
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/test-auth/email — send an email
// Body: { to, subject, body, threadId? }
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();

    const json = await req.json();
    const parsed = sendEmailBodySchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await sendEmail(userId, parsed.data);

    return Response.json({ ok: true, userId, result });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
