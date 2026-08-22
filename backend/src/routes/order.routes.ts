import { Router } from 'express';
import {
  checkout,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth';
import { authorizeRole } from '../middlewares/rbac';

const router = Router();

// Base auth required
router.use(authenticate);

// Student / User routes
router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);

// Staff & Admin routes
router.get('/', authorizeRole('Admin', 'Staff'), getAllOrders);
router.put('/:id/status', authorizeRole('Admin', 'Staff'), updateOrderStatus);

export default router;
