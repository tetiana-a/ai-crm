import { env } from '../config/env.js';

export async function triggerN8nReminder(payload) {
  if (!env.n8nWebhookUrl) return;

  await fetch(env.n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
