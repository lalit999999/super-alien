import { handleSync } from "@/modules/onboarding";

export async function POST(req: Request) {
  return handleSync(req);
}
