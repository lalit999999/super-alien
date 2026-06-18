import type { CreateTaskInput, UpdateTaskInput } from "./task.schema";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

// Matches the Task Prisma model — replace with TaskModel from generated types after `prisma generate`
export type DbTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  priority: TaskPriority;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type { CreateTaskInput, UpdateTaskInput };
