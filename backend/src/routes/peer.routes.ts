import { Router } from 'express';
import { getAvailableProducts } from '../controllers/peer.controller';
import { requireApiKey } from '../middlewares/apiKey';

const router = Router();

/**
 * Exposed Peer API for partner university systems
 * Endpoint: GET /api/products/available
 * Security: Header x-api-key
 */
router.get('/products/available', requireApiKey, getAvailableProducts);

export default router;
