import type { PrismaClient } from "@/config/generated/prisma/client";
import type { DbTask, CreateTaskInput, UpdateTaskInput } from "./task.types";

export class TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  async getTasksByUser(userId: string, completed?: boolean): Promise<DbTask[]> {
    return this.db.task.findMany({
      where: { userId, ...(completed !== undefined ? { completed } : {}) },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    }) as Promise<DbTask[]>;
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<DbTask> {
    return this.db.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        priority: input.priority,
      },
    }) as Promise<DbTask>;
  }

  async updateTask(id: string, userId: string, input: UpdateTaskInput): Promise<DbTask | null> {
    const existing = await this.db.task.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return this.db.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
        ...(input.completed !== undefined
          ? {
              completed: input.completed,
              completedAt: input.completed ? new Date() : null,
            }
          : {}),
      },
    }) as Promise<DbTask>;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await this.db.task.deleteMany({ where: { id, userId } });
  }
}
