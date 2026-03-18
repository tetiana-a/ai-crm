import { Router } from 'express';
import { createClient, getClients } from '../controllers/clientController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', authMiddleware, getClients);
router.post('/', authMiddleware, createClient);
export default router;
