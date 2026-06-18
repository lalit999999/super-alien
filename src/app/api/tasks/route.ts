import { type NextRequest } from "next/server";
import { handleListTasks, handleCreateTask } from "@/modules/task/task.controller";

export async function GET(req: NextRequest) {
  return handleListTasks(req);
}

export async function POST(req: NextRequest) {
  return handleCreateTask(req);
}
