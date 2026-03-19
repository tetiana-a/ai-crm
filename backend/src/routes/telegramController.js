import OpenAI from 'openai';
import pool from '../config/db.js';
import { env } from '../config/env.js';

const TELEGRAM_API = `https://api.telegram.org/bot${env.telegramBotToken}`;
const openai = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

async function linkTelegramToUser(code, telegramId, userData) {
  const result = await pool.query(
    `SELECT id FROM users WHERE telegram_code = $1`,
    [code]
  );

  const user = result.rows[0];

  if (!user) {
    return { ok: false, text: 'Invalid code' };
  }

  await pool.query(`
    INSERT INTO bot_links (user_id, telegram_id, username, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (telegram_id)
    DO UPDATE SET user_id = EXCLUDED.user_id
  `, [
    user.id,
    telegramId,
    userData.username,
    userData.first_name,
    userData.last_name
  ]);

  return { ok: true, text: '✅ Telegram connected to your account' };
}

async function getUserIdByTelegram(telegramId) {
  const result = await pool.query(
    `SELECT user_id FROM bot_links WHERE telegram_id = $1`,
    [telegramId]
  );

  return result.rows[0]?.user_id;
}

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

async function getClientsText(telegramId) {
  const userId = await getUserIdByTelegram(telegramId);

  if (!userId) return 'User not linked. Send /start';

  const result = await pool.query(
    `
    SELECT full_name, phone, email
    FROM clients
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10
    `,
    [userId]
  );

  const rows = result.rows;

  if (!rows.length) return 'No clients yet.';

  return [
    '<b>Latest clients:</b>',
    '',
    ...rows.map(
      (c, i) =>
        `${i + 1}. <b>${c.full_name}</b>${c.phone ? ` — ${c.phone}` : ''}${c.email ? ` — ${c.email}` : ''}`
    ),
  ].join('\n');
}

async function getTodayText(telegramId) {
  const userId = await getUserIdByTelegram(telegramId);

  if (!userId) return 'User not linked. Send /start';

  const result = await pool.query(
    `
    SELECT a.service_name, a.appointment_date, c.full_name
    FROM appointments a
    LEFT JOIN clients c ON c.id = a.client_id
    WHERE a.user_id = $1
      AND DATE(a.appointment_date) = CURRENT_DATE
    ORDER BY a.appointment_date ASC
    LIMIT 10
    `,
    [userId]
  );

  const rows = result.rows;

  if (!rows.length) return 'No appointments for today.';

  return [
    '<b>Today appointments:</b>',
    '',
    ...rows.map(
      (a, i) =>
        `${i + 1}. <b>${a.service_name}</b> — ${new Date(a.appointment_date).toLocaleString()}${a.full_name ? ` — ${a.full_name}` : ''}`
    ),
  ].join('\n');
}

async function getStatsText(telegramId) {
  const userId = await getUserIdByTelegram(telegramId);

  if (!userId) return 'User not linked. Send /start';

  const [clientsCount, appointmentsCount, paymentsSum] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM clients WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM appointments WHERE user_id = $1 AND DATE(appointment_date) = CURRENT_DATE`,
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE user_id = $1`,
      [userId]
    ),
  ]);

  const clients = clientsCount.rows[0]?.count || 0;
  const todayAppointments = appointmentsCount.rows[0]?.count || 0;
  const totalRevenue = paymentsSum.rows[0]?.total || 0;

  return `📊 <b>CRM Stats</b>

Clients: <b>${clients}</b>
Today appointments: <b>${todayAppointments}</b>
Revenue: <b>€${totalRevenue}</b>`;
}

async function createClientFromText(rawText, telegramId) {
  const userId = await getUserIdByTelegram(telegramId);

  if (!userId) {
    return {
      ok: false,
      text: 'User not linked. Send /start',
    };
  }

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
    INSERT INTO clients (user_id, full_name, phone, email, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, full_name, phone, email, notes
    `,
    [userId, full_name, phone, email, notes]
  );

  const client = result.rows[0];

  return {
    ok: true,
    text: `✅ <b>Client created</b>

Name: <b>${client.full_name}</b>
${client.phone ? `Phone: ${client.phone}\n` : ''}${client.email ? `Email: ${client.email}\n` : ''}${client.notes ? `Notes: ${client.notes}` : ''}`,
  };
}

async function createBookingFromText(rawText, telegramId) {
  const userId = await getUserIdByTelegram(telegramId);

  if (!userId) {
    return {
      ok: false,
      text: 'User not linked. Send /start',
    };
  }

  const payload = rawText.replace(/^\/newbooking\s*/i, '').trim();

  if (!payload) {
    return {
      ok: false,
      text: 'Use format:\n/newbooking Anna | Manicure | 2026-03-20 15:00',
    };
  }

  const parts = payload.split('|').map((x) => x.trim());

  const clientName = parts[0] || '';
  const serviceName = parts[1] || '';
  const appointmentDateRaw = parts[2] || '';

  if (!clientName || !serviceName || !appointmentDateRaw) {
    return {
      ok: false,
      text: 'Use format:\n/newbooking Anna | Manicure | 2026-03-20 15:00',
    };
  }

  const clientResult = await pool.query(
    `
    SELECT id, full_name
    FROM clients
    WHERE user_id = $1
      AND LOWER(full_name) = LOWER($2)
    LIMIT 1
    `,
    [userId, clientName]
  );

  const client = clientResult.rows[0];

  if (!client) {
    return {
      ok: false,
      text: `Client "${clientName}" not found.`,
    };
  }

  const appointmentDate = new Date(appointmentDateRaw);

  if (Number.isNaN(appointmentDate.getTime())) {
    return {
      ok: false,
      text: 'Invalid date. Example:\n/newbooking Anna | Manicure | 2026-03-20 15:00',
    };
  }

  const result = await pool.query(
    `
    INSERT INTO appointments (user_id, client_id, service_name, appointment_date, status)
    VALUES ($1, $2, $3, $4, 'booked')
    RETURNING id, service_name, appointment_date
    `,
    [userId, client.id, serviceName, appointmentDate.toISOString()]
  );

  const booking = result.rows[0];

  return {
    ok: true,
    text: `✅ <b>Appointment created</b>

Client: <b>${client.full_name}</b>
Service: <b>${booking.service_name}</b>
Date: <b>${new Date(booking.appointment_date).toLocaleString()}</b>`,
  };
}

async function handleAiCommand(text, telegramId) {
  const userId = await getUserIdByTelegram(telegramId);

  if (!userId) {
    return {
      ok: false,
      text: 'User not linked. Send /start',
    };
  }

  if (!openai) {
    return {
      ok: false,
      text: 'OPENAI_API_KEY is not configured.',
    };
  }

  const prompt = `
You are a CRM assistant.
Extract intent from the user's message.

Supported intents:
1. create_client
2. create_appointment
3. unknown

Return ONLY valid JSON in this format:
{
  "intent": "create_client" | "create_appointment" | "unknown",
  "client_name": string | null,
  "phone": string | null,
  "email": string | null,
  "notes": string | null,
  "service_name": string | null,
  "appointment_date": string | null
}

Rules:
- appointment_date must be in YYYY-MM-DD HH:mm format if possible.
- If missing, use null.
- No markdown.
User message: ${text}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: 'You extract CRM actions into JSON.' },
      { role: 'user', content: prompt },
    ],
  });

  let parsed;

  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    return {
      ok: false,
      text: 'AI could not parse the message.',
    };
  }

  if (parsed.intent === 'create_client') {
    if (!parsed.client_name) {
      return { ok: false, text: 'AI could not detect client name.' };
    }

    const result = await pool.query(
      `
      INSERT INTO clients (user_id, full_name, phone, email, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name
      `,
      [userId, parsed.client_name, parsed.phone, parsed.email, parsed.notes]
    );

    return {
      ok: true,
      text: `✅ <b>AI created client</b>

Name: <b>${result.rows[0].full_name}</b>`,
    };
  }

  if (parsed.intent === 'create_appointment') {
    if (!parsed.client_name || !parsed.service_name || !parsed.appointment_date) {
      return {
        ok: false,
        text: 'AI could not detect all booking fields.',
      };
    }

    const clientResult = await pool.query(
      `
      SELECT id, full_name
      FROM clients
      WHERE user_id = $1
        AND LOWER(full_name) = LOWER($2)
      LIMIT 1
      `,
      [userId, parsed.client_name]
    );

    const client = clientResult.rows[0];

    if (!client) {
      return {
        ok: false,
        text: `Client "${parsed.client_name}" not found.`,
      };
    }

    const appointmentDate = new Date(parsed.appointment_date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return {
        ok: false,
        text: 'AI returned invalid date.',
      };
    }

    const bookingResult = await pool.query(
      `
      INSERT INTO appointments (user_id, client_id, service_name, appointment_date, status)
      VALUES ($1, $2, $3, $4, 'booked')
      RETURNING id, service_name, appointment_date
      `,
      [userId, client.id, parsed.service_name, appointmentDate.toISOString()]
    );

    return {
      ok: true,
      text: `✅ <b>AI created appointment</b>

Client: <b>${client.full_name}</b>
Service: <b>${bookingResult.rows[0].service_name}</b>
Date: <b>${new Date(bookingResult.rows[0].appointment_date).toLocaleString()}</b>`,
    };
  }

  return {
    ok: false,
    text: 'AI did not recognize the command.',
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
        await sendMessage(chatId, await getClientsText(chatId), {
          reply_markup: mainKeyboard(),
        });
      } else if (data === 'today') {
        await sendMessage(chatId, await getTodayText(chatId), {
          reply_markup: mainKeyboard(),
        });
      } else if (data === 'stats') {
        await sendMessage(chatId, await getStatsText(chatId), {
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
      const telegramId = message.from.id;
      const username = message.from.username || null;
      const firstName = message.from.first_name || null;
      const lastName = message.from.last_name || null;

      const userId = 1;

      await pool.query(
        `
        INSERT INTO bot_links (user_id, telegram_id, username, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (telegram_id)
        DO UPDATE SET
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
        `,
        [userId, telegramId, username, firstName, lastName]
      );

      await sendMessage(
        chatId,
        `👋 <b>Welcome to Nexara CRM Bot</b>

Commands:
/help
/clients
/today
/stats
/newclient
/newbooking
/ai add client Anna tomorrow 15:00`,
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
/newclient Anna | +420777123456 | anna@gmail.com | VIP client
/newbooking Anna | Manicure | 2026-03-20 15:00
/ai add client Anna tomorrow 15:00`,
        { reply_markup: mainKeyboard() }
      );
      return res.sendStatus(200);
    }

    if (text === '/clients') {
      await sendMessage(chatId, await getClientsText(chatId), {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text === '/today') {
      await sendMessage(chatId, await getTodayText(chatId), {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text === '/stats') {
      await sendMessage(chatId, await getStatsText(chatId), {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text.startsWith('/newclient')) {
      const result = await createClientFromText(text, chatId);
      await sendMessage(chatId, result.text, {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text.startsWith('/newbooking')) {
      const result = await createBookingFromText(text, chatId);
      await sendMessage(chatId, result.text, {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    if (text.startsWith('/ai ')) {
      const result = await handleAiCommand(text.replace(/^\/ai\s+/i, ''), chatId);
      await sendMessage(chatId, result.text, {
        reply_markup: mainKeyboard(),
      });
      return res.sendStatus(200);
    }

    await sendMessage(chatId, 'Unknown command. Use /help', {
      reply_markup: mainKeyboard(),
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error('telegramWebhookController error:', error);
    return res.sendStatus(200);
  }
}
