import { pool } from '../config/db.js';
import { generateBusinessInsight, generateReply } from '../services/openaiService.js';

function languageMap(code) {
  if (code === 'uk') return 'Ukrainian';
  if (code === 'cs') return 'Czech';
  return 'English';
}

export async function getAiReply(req, res, next) {
  try {
    const { clientName, message, tone } = req.body;

    const reply = await generateReply({
      clientName,
      message,
      tone,
      language: languageMap(req.user?.preferred_language),
    });

    res.json({ reply });
  } catch (error) {
    console.error('getAiReply error:', error);
    next(error);
  }
}

export async function getAiInsights(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE user_id = $1',
      [userId]
    );

    const appointmentsResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM appointments WHERE user_id = $1',
      [userId]
    );

    const repeatClientsResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM (
        SELECT client_id
        FROM appointments
        WHERE user_id = $1
        GROUP BY client_id
        HAVING COUNT(*) > 1
      ) t`,
      [userId]
    );

    const insights = await generateBusinessInsight({
      revenue: Number(revenueResult.rows[0]?.total || 0),
      appointmentsCount: appointmentsResult.rows[0]?.total || 0,
      repeatClients: repeatClientsResult.rows[0]?.total || 0,
      language: languageMap(req.user?.preferred_language),
    });

    res.json({ insights });
  } catch (error) {
    console.error('getAiInsights error:', error);
    next(error);
  }
}