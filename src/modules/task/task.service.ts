import type { TaskRepository } from "./task.repository";
import type { DbTask, CreateTaskInput, UpdateTaskInput } from "./task.types";

export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  async getTasksByUser(userId: string, completed?: boolean): Promise<DbTask[]> {
    return this.repo.getTasksByUser(userId, completed);
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<DbTask> {
    return this.repo.createTask(userId, input);
  }

  async updateTask(id: string, userId: string, input: UpdateTaskInput): Promise<DbTask | null> {
    return this.repo.updateTask(id, userId, input);
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    return this.repo.deleteTask(id, userId);
  }
}
