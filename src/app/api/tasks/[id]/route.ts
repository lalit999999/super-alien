import { type NextRequest } from "next/server";
import { handleUpdateTask, handleDeleteTask } from "@/modules/task/task.controller";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdateTask(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleDeleteTask(req, context);
}
