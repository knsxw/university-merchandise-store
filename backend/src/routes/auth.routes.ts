import { Router } from 'express';
import { microsoftLogin, devLogin, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Entra ID login / token exchange
router.post('/microsoft', microsoftLogin);

// Dev login switcher for local testing
router.post('/dev-login', devLogin);

// Current user profile
router.get('/me', authenticate, getMe);

export default router;
