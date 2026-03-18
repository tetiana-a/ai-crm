import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = Router();
router.get('/', authMiddleware, getDashboard);
export default router;
