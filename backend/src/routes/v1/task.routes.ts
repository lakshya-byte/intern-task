import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../../controllers/task.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { cacheResponse } from '../../middleware/cache.middleware';
import { createTaskSchema, updateTaskSchema } from '../../validators/task.validator';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', cacheResponse(60, 'tasks'), getTasks);
router.get('/:id', cacheResponse(60, 'tasks'), getTaskById);
router.post('/', validate(createTaskSchema), createTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
