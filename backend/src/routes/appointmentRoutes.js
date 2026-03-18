import { Router } from 'express';
import { createAppointment, getAppointments } from '../controllers/appointmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', authMiddleware, getAppointments);
router.post('/', authMiddleware, createAppointment);
export default router;
