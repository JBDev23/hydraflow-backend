import { Router } from 'express';
import { logWater, getDailyMetrics, revertLog, getRangeMetrics, getStatsGraph } from '../controllers/water.controller';
import { ensureAuth } from '../middleware/auth.middleware';

const router = Router();

// POST /water/log
router.post('/log', ensureAuth, logWater);

// DELETE /water/log
router.delete('/log', ensureAuth, revertLog)

// GET /water/metrics
// GET /water/metrics?date=2023-12-25
router.get('/metrics', ensureAuth, getDailyMetrics);

// GET /water/range?startDate=2026-02-09&endDate=2026-02-15
router.get('/range', ensureAuth, getRangeMetrics);

// GET /water/stats?mode=week&refDate=2026-02-15
router.get('/stats', ensureAuth, getStatsGraph);


export default router;