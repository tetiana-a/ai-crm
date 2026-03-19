import pool from '../config/db.js';
import { env } from '../config/env.js';

async function getUserIdByTelegram(telegramId) {
  const result = await pool.query(
    `SELECT user_id FROM bot_links WHERE telegram_id = $1`,
    [telegramId]
  );

  return result.rows[0]?.user_id;
}

const TELEGRAM_API = `https://api.telegram.org/bot${env.telegramBotToken}`;

async function telegram(method, body) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error(`Telegram ${method} error:`, data);
  }

  return data;
}

async function sendMessage(chatId, text, extra = {}) {
  return telegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '➕ Add client', callback_data: 'add_client' },
        { text: '📅 Today', callback_data: 'today' },
      ],
      [
        { text: '👥 Clients', callback_data: 'clients' },
        { text: '📊 Stats', callback_data: 'stats' },
      ],
    ],
  };
}

async function getClientsText() {
  const result = await pool.query(`
    SELECT full_name, phone, email
    FROM clients
    ORDER BY created_at DESC
    LIMIT 10
  `);

  const rows = result.rows;

  if (!rows.length) return 'No clients yet.';

  return [
    '<b>Latest clients:</b>',
    '',
    ...rows.map((c, i) =>
      `${i + 1}. <b>${c.full_name}</b>${c.phone ? ` — ${c.phone}` : ''}${c.email ? ` — ${c.email}` : ''}`
    ),
  ].join('\n');
}

async function getTodayText() {
  const result = await pool.query(`
    SELECT a.service_name, a.appointment_date, c.full_name
    FROM appointments a
    LEFT JOIN clients c ON c.id = a.client_id
    WHERE DATE(a.appointment_date) = CURRENT_DATE
    ORDER BY a.appointment_date ASC
    LIMIT 10
  `);

  const rows = result.rows;

  if (!rows.length) return 'No appointments for today.';

  return [
    '<b>Today appointments:</b>',
    '',
    ...rows.map((a, i) =>
      `${i + 1}. <b>${a.service_name}</b> — ${new Date(a.appointment_date).toLocaleString()}${a.full_name ? ` — ${a.full_name}` : ''}`
    ),
  ].join('\n');
}

async function getStatsText() {
  const [clientsCount, appointmentsCount, paymentsSum] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM clients`),
    pool.query(`SELECT COUNT(*)::int AS count FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE`),
    pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments`),
  ]);

  const clients = clientsCount.rows[0]?.count || 0;
  const todayAppointments = appointmentsCount.rows[0]?.count || 0;
  const totalRevenue = paymentsSum.rows[0]?.total || 0;

  return `📊 <b>CRM Stats</b>

Clients: <b>${clients}</b>
Today appointments: <b>${todayAppointments}</b>
Revenue: <b>€${totalRevenue}</b>`;
}

async function createClientFromText(rawText) {
  const payload = rawText.replace(/^\/newclient\s*/i, '').trim();

  if (!payload) {
    return {
      ok: false,
      text: 'Use format:\n/newclient Anna | +420777123456 | anna@gmail.com | VIP client',
    };
  }

  const parts = payload.split('|').map((x) => x.trim());

  const full_name = parts[0] || '';
  const phone = parts[1] || null;
  const email = parts[2] || null;
  const notes = parts[3] || null;

  if (!full_name) {
    return {
      ok: false,
      text: 'Client name is required.\nExample:\n/newclient Anna | +420777123456 | anna@gmail.com | VIP client',
    };
  }

  const result = await pool.query(
    `
    INSERT INTO clients (full_name, phone, email, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, phone, email, notes
    `,
    [full_name, phone, email, notes]
  );

  const client = result.rows[0];

  return {
    ok: true,
    text: `✅ <b>Client created</b>

Name: <b>${client.full_name}</b>
${client.phone ? `Phone: ${client.phone}\n` : ''}${client.email ? `Email: ${client.email}\n` : ''}${client.notes ? `Notes: ${client.notes}` : ''}`,
  };
}

export async function telegramWebhookController(req, res) {
  try {
    const update = req.body;

    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      await telegram('answerCallbackQuery', {
        callback_query_id: update.callback_query.id,
      });

      if (data === 'clients') {
        await sendMessage(chatId, await getClientsText(), {
          reply_markup: mainKeyboard(),
        });
      } else if (data === 'today') {
        await sendMessage(chatId, await getTodayText(), {
          reply_markup: mainKeyboard(),
        });
      } else if (data === 'stats') {
        await sendMessage(chatId, await getStatsText(), {
          reply_markup: mainKeyboard(),
        });
      } else if (data === 'add_client') {
        await sendMessage(
          chatId,
          'Send client in this format:\n/newclient Anna | +420777123456 | anna@gmail.com | VIP client',
          { reply_markup: mainKeyboard() }
        );
      }

      return res.sendStatus(200);
    }

    const message = update.message;

    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === '/start') {
      await sendMessage(
        chatId,
        `👋 <b>Welcome to Nexara CRM Bot</b>

Commands:
/help
/clients
/today
/stats
/newclient`,
        { reply_markup: mainKeyboard() }
      );
      return res.sendStatus(200);
    }

    if (text === '/help') {
      await sendMessage(
        chatId,
        `<b>Commands:</b>
/start — start bot
/help — help
/clients — latest clients
/today — today appointments
/stats — CRM stats
/newclient Anna | +420777123456 | anna@gmail.com | VIP client`,
        { reply_markup: mainKeyboard() }
      );
      return res.sendStatus(200);
    }

    if (text === '/clients') {
      await sendMessage(chatId, await getClientsText(), {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text === '/today') {
      await sendMessage(chatId, await getTodayText(), {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text === '/stats') {
  const telegramId = message.from.id;
  const username = message.from.username || null;
  const firstName = message.from.first_name || null;
  const lastName = message.from.last_name || null;

  // 🔥 MVP: твій user_id (з таблиці users)
  const userId = 1;

  await pool.query(`
    INSERT INTO bot_links (user_id, telegram_id, username, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (telegram_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name
  `, [
    userId,
    telegramId,
    username,
    firstName,
    lastName
  ]);

  await sendMessage(
    chatId,
    `👋 <b>Welcome to Nexara CRM Bot</b>

Commands:
/help
/clients
/today
/stats`,
    { reply_markup: mainKeyboard() }
  );

  return res.sendStatus(200);
}

    if (text.startsWith('/newclient')) {
      const result = await createClientFromText(text);
      await sendMessage(chatId, result.text, {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    await sendMessage(
      chatId,
      'Unknown command. Use /help',
      { reply_markup: mainKeyboard() }
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error('telegramWebhookController error:', error);
    return res.sendStatus(200);
  }
}
