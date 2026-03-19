import express from 'express';
import { telegramWebhookController } from './telegramController.js';

const router = express.Router();

router.post('/webhook', async (req, res) => {
  try {
    await telegramWebhookController(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.sendStatus(200);
  }
});

export default router;
