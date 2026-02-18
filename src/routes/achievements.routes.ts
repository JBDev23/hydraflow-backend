import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.middleware';
import { getAchievements } from '../controllers/achievements.controller';

const router = Router();


router.get('/catalog', ensureAuth, getAchievements);

export default router;