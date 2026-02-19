import { Router } from 'express';
import { deleteAccount, getProfile, updateProfile } from '../controllers/user.controller';
import { ensureAuth } from '../middleware/auth.middleware';

const router = Router();

// PUT /user/profile - Protegida con ensureAuth
router.put('/profile', ensureAuth, updateProfile);

// GET /user/profile
router.get('/profile', ensureAuth, getProfile)

// DELETE /user/account
router.delete('/account', ensureAuth, deleteAccount);

export default router;