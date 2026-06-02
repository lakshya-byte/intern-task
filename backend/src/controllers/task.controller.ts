import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { invalidateCache } from '../config/redis';
import logger from '../config/logger';

/**
 * @openapi
 * /api/v1/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks (own tasks for user, all tasks for admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt, dueDate, -dueDate, priority]
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Not authenticated
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const filter: Record<string, unknown> = {};

    // Regular users only see their own tasks
    if (req.user!.role !== 'admin') {
      filter.createdBy = req.user!._id;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = String(sort);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('createdBy', 'name email')
        .sort(sortField)
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    sendSuccess(res, { tasks }, 'Tasks retrieved successfully', 200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a single task by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id).populate('createdBy', 'name email');
    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    // Ownership check for non-admins
    if (req.user!.role !== 'admin' && task.createdBy._id.toString() !== req.user!._id.toString()) {
      return next(new AppError('You do not have permission to view this task.', 403));
    }

    sendSuccess(res, { task }, 'Task retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /api/v1/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Build REST API
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Validation error
 */
export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user!._id,
    });

    // Invalidate list cache for this user
    await invalidateCache(`cache:tasks:${req.user!._id}:*`);

    logger.info('Task created', { taskId: task._id, userId: req.user!._id, title });

    sendSuccess(res, { task }, 'Task created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    if (req.user!.role !== 'admin' && task.createdBy.toString() !== req.user!._id.toString()) {
      return next(new AppError('You do not have permission to update this task.', 403));
    }

    const { title, description, status, priority, dueDate } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    await invalidateCache(`cache:tasks:${task.createdBy}:*`);

    logger.info('Task updated', { taskId: task._id, userId: req.user!._id });

    sendSuccess(res, { task: updated }, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /api/v1/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    if (req.user!.role !== 'admin' && task.createdBy.toString() !== req.user!._id.toString()) {
      return next(new AppError('You do not have permission to delete this task.', 403));
    }

    await Task.findByIdAndDelete(req.params.id);
    await invalidateCache(`cache:tasks:${task.createdBy}:*`);

    logger.info('Task deleted', { taskId: task._id, userId: req.user!._id });

    sendSuccess(res, null, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};
