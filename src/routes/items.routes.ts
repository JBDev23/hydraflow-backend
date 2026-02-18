import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.middleware';
import { buyItem, equipItem, getItems } from '../controllers/items.controller';

const router = Router();

router.get('/catalog', ensureAuth, getItems);

// POST /shop/buy -> Body: { itemId: "hat1" }
router.post('/buy', ensureAuth, buyItem);

// POST /shop/equip -> Body: { itemId: "hat1" }
router.post('/equip', ensureAuth, equipItem);

export default router;