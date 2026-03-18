import { Router } from 'express';
import { getAiInsights, getAiReply } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/reply', authMiddleware, getAiReply);
router.get('/insights', authMiddleware, getAiInsights);
export default router;
