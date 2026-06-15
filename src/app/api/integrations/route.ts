import { handleGetStatus } from "@/modules/onboarding";

export async function GET(req: Request) {
  return handleGetStatus(req);
}
