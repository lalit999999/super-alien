import { handleCompleteOnboarding } from "@/modules/onboarding";

export async function POST(req: Request) {
  return handleCompleteOnboarding(req);
}
