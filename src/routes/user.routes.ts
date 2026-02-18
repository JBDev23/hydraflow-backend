import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { ensureAuth } from '../middleware/auth.middleware';

const router = Router();

// PUT /user/profile - Protegida con ensureAuth
router.put('/profile', ensureAuth, updateProfile);

// GET /user/profile
router.get('/profile', ensureAuth, getProfile)

export default router;