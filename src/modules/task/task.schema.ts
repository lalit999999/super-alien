import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  completed: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskListQuerySchema = z.object({
  completed: z.coerce.boolean().optional(),
});

export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
