import { Router } from 'express';
import { socialLogin } from '../controllers/auth.controller';

const router = Router();

// POST http://localhost:3000/auth/login
router.post('/login', socialLogin);

export default router;