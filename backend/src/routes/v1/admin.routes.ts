import { Router } from 'express';
import { getAllUsers, deleteUser, getStats } from '../../controllers/admin.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { cacheResponse } from '../../middleware/cache.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/users', cacheResponse(30, 'admin-users'), getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/stats', cacheResponse(60, 'admin-stats'), getStats);

export default router;
