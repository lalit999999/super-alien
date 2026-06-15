import { handleDisconnect } from "@/modules/onboarding";

export async function POST(req: Request) {
  return handleDisconnect(req);
}
