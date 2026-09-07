import { Router } from 'express';
import { getSiteSettings, updateSiteSettings } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth';
import { authorizeRole } from '../middlewares/rbac';

const router = Router();

// Site settings are Administrator-only
router.use(authenticate, authorizeRole('Admin'));
router.get('/', getSiteSettings);
router.put('/', updateSiteSettings);

export default router;
