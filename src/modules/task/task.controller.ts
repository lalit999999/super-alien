import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { AuthRepository } from "@/modules/auth";
import { prisma } from "@/lib/prisma";
import { TaskRepository } from "./task.repository";
import { TaskService } from "./task.service";
import {
  createTaskSchema,
  updateTaskSchema,
  taskListQuerySchema,
} from "./task.schema";
import { TASK_ERRORS } from "./task.constants";

function makeService(): TaskService {
  return new TaskService(new TaskRepository(prisma));
}

function makeAuthRepo(): AuthRepository {
  return new AuthRepository(prisma);
}

export async function handleListTasks(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const { searchParams } = new URL(req.url);
  const queryParsed = taskListQuerySchema.safeParse({
    completed: searchParams.get("completed") ?? undefined,
  });
  if (!queryParsed.success) {
    return fail("Invalid query parameters", "VALIDATION_ERROR");
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) return fail("User not found", TASK_ERRORS.USER_NOT_FOUND, 404);

  const tasks = await makeService().getTasksByUser(dbUser.id, queryParsed.data.completed);
  return ok({ tasks });
}

export async function handleCreateTask(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR");
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) return fail("User not found", TASK_ERRORS.USER_NOT_FOUND, 404);

  const task = await makeService().createTask(dbUser.id, parsed.data);
  return ok({ task }, 201);
}

export async function handleUpdateTask(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR");
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) return fail("User not found", TASK_ERRORS.USER_NOT_FOUND, 404);

  const task = await makeService().updateTask(id, dbUser.id, parsed.data);
  if (!task) return fail("Task not found", TASK_ERRORS.TASK_NOT_FOUND, 404);

  return ok({ task });
}

export async function handleDeleteTask(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) return fail("User not found", TASK_ERRORS.USER_NOT_FOUND, 404);

  await makeService().deleteTask(id, dbUser.id);
  return ok({ success: true });
}
