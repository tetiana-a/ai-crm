import { env } from '../config/env.js';

export async function sendTelegramMessage(text) {
  if (!env.telegramBotToken || !env.telegramChatId) return;

  await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.telegramChatId, text })
  });
}
