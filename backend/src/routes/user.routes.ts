import { Router } from 'express';
import { getAllUsers, updateUserRole, getAllRoles } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { authorizeRole } from '../middlewares/rbac';

const router = Router();

// Admin only routes
router.use(authenticate, authorizeRole('Admin'));

router.get('/', getAllUsers);
router.get('/roles', getAllRoles);
router.put('/:id', updateUserRole);

export default router;
