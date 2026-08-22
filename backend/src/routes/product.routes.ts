import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  generateAiDescription,
  getCategories,
} from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';
import { authorizeRole } from '../middlewares/rbac';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Staff & Admin protected routes
router.post('/ai-description', authenticate, authorizeRole('Admin', 'Staff'), generateAiDescription);
router.post('/', authenticate, authorizeRole('Admin', 'Staff'), createProduct);
router.put('/:id', authenticate, authorizeRole('Admin', 'Staff'), updateProduct);
router.delete('/:id', authenticate, authorizeRole('Admin', 'Staff'), deleteProduct);

export default router;
