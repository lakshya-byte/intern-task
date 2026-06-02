import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { invalidateCache } from '../config/redis';
import logger from '../config/logger';

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Admin access required
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort('-createdAt').skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    sendSuccess(res, { users }, 'Users retrieved successfully', 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /api/v1/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user and all their tasks (admin only)
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
 *         description: User and tasks deleted
 *       400:
 *         description: Cannot delete yourself
 *       404:
 *         description: User not found
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!._id.toString()) {
      return next(new AppError('You cannot delete your own account.', 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // Delete user's tasks
    const { deletedCount } = await Task.deleteMany({ createdBy: id });

    await User.findByIdAndDelete(id);
    await invalidateCache(`cache:tasks:${id}:*`);

    logger.warn('Admin deleted user', {
      adminId: req.user!._id,
      deletedUserId: id,
      deletedTaskCount: deletedCount,
    });

    sendSuccess(res, null, `User and ${deletedCount} task(s) deleted successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * @openapi
 * /api/v1/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform statistics (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 */
export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalTasks, tasksByStatus, tasksByPriority] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    sendSuccess(res, {
      totalUsers,
      totalTasks,
      tasksByStatus: Object.fromEntries(tasksByStatus.map((s) => [s._id, s.count])),
      tasksByPriority: Object.fromEntries(tasksByPriority.map((p) => [p._id, p.count])),
    }, 'Statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};
