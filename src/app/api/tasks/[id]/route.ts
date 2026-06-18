import { type NextRequest } from "next/server";
import { handleUpdateTask, handleDeleteTask } from "@/modules/task/task.controller";
import { fail } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleUpdateTask(req, context);
  } catch {
    return fail("Failed to update task", "UPDATE_FAILED", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleDeleteTask(req, context);
  } catch {
    return fail("Failed to delete task", "DELETE_FAILED", 500);
  }
}
