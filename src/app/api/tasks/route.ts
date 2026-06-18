import { type NextRequest } from "next/server";
import { handleListTasks, handleCreateTask } from "@/modules/task/task.controller";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleListTasks(req);
  } catch {
    return fail("Failed to fetch tasks", "FETCH_FAILED", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleCreateTask(req);
  } catch {
    return fail("Failed to create task", "CREATE_FAILED", 500);
  }
}
