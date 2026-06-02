import { z } from 'zod';

const taskStatusEnum = z.enum(['pending', 'in-progress', 'completed']);
const taskPriorityEnum = z.enum(['low', 'medium', 'high']);

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  status: taskStatusEnum.optional().default('pending'),
  priority: taskPriorityEnum.optional().default('medium'),
  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date-time string' })
    .optional()
    .nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 10)),
  sort: z.enum(['createdAt', '-createdAt', 'dueDate', '-dueDate', 'priority']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
