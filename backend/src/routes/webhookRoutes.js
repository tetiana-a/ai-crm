import express from 'express';
import { telegramWebhookController } from './telegramController.js';

const router = express.Router();

router.post('/telegram', telegramWebhookController);

export default router;
