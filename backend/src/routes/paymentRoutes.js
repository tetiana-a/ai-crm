import { Router } from 'express';
import { createPayment, getPayments } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', authMiddleware, getPayments);
router.post('/', authMiddleware, createPayment);
export default router;
