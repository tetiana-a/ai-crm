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

function formatClients(clients) {
  if (!clients.length) return 'No clients yet.';

  return [
    '<b>Your clients:</b>',
    ...clients.slice(0, 10).map(
      (c, i) =>
        `${i + 1}. <b>${c.full_name}</b>${
          c.phone ? ` — ${c.phone}` : ''
        }${c.email ? ` — ${c.email}` : ''}`
    ),
  ].join('\n');
}

function formatAppointments(appointments) {
  if (!appointments.length) return 'No appointments for today.';

  return [
    '<b>Today appointments:</b>',
    ...appointments.slice(0, 10).map(
      (a, i) =>
        `${i + 1}. <b>${a.service_name}</b> — ${new Date(
          a.appointment_date
        ).toLocaleString()}`
    ),
  ].join('\n');
}

export async function telegramWebhookController(req, res) {
  try {
    const update = req.body;

    if (!update.message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = (update.message.text || '').trim();

    if (!text) {
      await sendTelegramMessage(chatId, 'Please send a command.');
      return res.status(200).json({ ok: true });
    }

    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        `👋 <b>Welcome to Nexara CRM Bot</b>

Available commands:
/help
/clients
/today
/stats

This is your CRM assistant inside Telegram.`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === '/help') {
      await sendTelegramMessage(
        chatId,
        `<b>Commands:</b>
/start — start bot
/help — show help
/clients — show latest clients
/today — show today's appointments
/stats — show CRM stats`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === '/clients') {
      const clientsResult = await pool.query(
        `
        SELECT id, full_name, phone, email
        FROM clients
        ORDER BY created_at DESC
        LIMIT 10
        `
      );

      await sendTelegramMessage(chatId, formatClients(clientsResult.rows));
      return res.status(200).json({ ok: true });
    }

    if (text === '/today') {
      const appointmentsResult = await pool.query(
        `
        SELECT id, service_name, appointment_date
        FROM appointments
        WHERE DATE(appointment_date) = CURRENT_DATE
        ORDER BY appointment_date ASC
        LIMIT 10
        `
      );

      await sendTelegramMessage(
        chatId,
        formatAppointments(appointmentsResult.rows)
      );
      return res.status(200).json({ ok: true });
    }

    if (text === '/stats') {
      const [clientsCount, appointmentsCount, paymentsSum] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM clients`),
        pool.query(
          `SELECT COUNT(*)::int AS count FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE`
        ),
        pool.query(
          `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments`
        ),
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

    await sendTelegramMessage(
      chatId,
      `Unknown command: ${text}

Use /help to see available commands.`
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('telegramWebhookController error:', error);
    return res.status(500).json({ message: 'Telegram webhook error' });
  }
}
