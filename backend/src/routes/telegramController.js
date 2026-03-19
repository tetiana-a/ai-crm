import pool from '../config/db.js';
import { env } from '../config/env.js';

const TELEGRAM_API = `https://api.telegram.org/bot${env.telegramBotToken}`;

async function sendTelegramMessage(chatId, text) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error('Telegram sendMessage error:', data);
  }

  return data;
}

export async function telegramWebhookController(req, res) {
  try {
    const update = req.body;

    if (!update.message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = (update.message.text || '').trim();

    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        `👋 <b>Welcome to Nexara CRM Bot</b>

Commands:
/help
/clients
/today
/stats`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === '/help') {
      await sendTelegramMessage(
        chatId,
        `<b>Commands:</b>
/start — start bot
/help — help
/clients — latest clients
/today — today appointments
/stats — CRM stats`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === '/clients') {
      const result = await pool.query(`
        SELECT full_name, phone, email
        FROM clients
        ORDER BY created_at DESC
        LIMIT 10
      `);

      const rows = result.rows;

      if (!rows.length) {
        await sendTelegramMessage(chatId, 'No clients yet.');
        return res.status(200).json({ ok: true });
      }

      const textOut = [
        '<b>Your clients:</b>',
        ...rows.map(
          (c, i) =>
            `${i + 1}. <b>${c.full_name}</b>${c.phone ? ` — ${c.phone}` : ''}${c.email ? ` — ${c.email}` : ''}`
        ),
      ].join('\n');

      await sendTelegramMessage(chatId, textOut);
      return res.status(200).json({ ok: true });
    }

    if (text === '/today') {
      const result = await pool.query(`
        SELECT service_name, appointment_date
        FROM appointments
        WHERE DATE(appointment_date) = CURRENT_DATE
        ORDER BY appointment_date ASC
        LIMIT 10
      `);

      const rows = result.rows;

      if (!rows.length) {
        await sendTelegramMessage(chatId, 'No appointments for today.');
        return res.status(200).json({ ok: true });
      }

      const textOut = [
        '<b>Today appointments:</b>',
        ...rows.map(
          (a, i) =>
            `${i + 1}. <b>${a.service_name}</b> — ${new Date(a.appointment_date).toLocaleString()}`
        ),
      ].join('\n');

      await sendTelegramMessage(chatId, textOut);
      return res.status(200).json({ ok: true });
    }

    if (text === '/stats') {
      const [clientsCount, appointmentsCount, paymentsSum] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM clients`),
        pool.query(`SELECT COUNT(*)::int AS count FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE`),
        pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments`),
      ]);

      const clients = clientsCount.rows[0]?.count || 0;
      const todayAppointments = appointmentsCount.rows[0]?.count || 0;
      const totalRevenue = paymentsSum.rows[0]?.total || 0;

      await sendTelegramMessage(
        chatId,
        `📊 <b>CRM Stats</b>

Clients: <b>${clients}</b>
Today appointments: <b>${todayAppointments}</b>
Revenue: <b>€${totalRevenue}</b>`
      );

      return res.status(200).json({ ok: true });
    }

    await sendTelegramMessage(chatId, 'Unknown command. Use /help');
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('telegramWebhookController error:', error);
    return res.status(500).json({ message: 'Telegram webhook error' });
  }
}
