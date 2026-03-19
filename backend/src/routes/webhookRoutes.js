import express from 'express';
import { telegramWebhookController } from './telegramController.js';

const router = express.Router();

router.post('/telegram', telegramWebhookController);

export default router;
if (text.startsWith('/link')) {
  const code = text.split(' ')[1];

  const result = await linkTelegramToUser(code, chatId, message.from);

  await sendMessage(chatId, result.text, {
    reply_markup: mainKeyboard(),
  });

  return res.sendStatus(200);
}
