import { pool } from '../config/db.js';

export async function getDashboard(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [clients, appointments, payments, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM clients WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS total FROM appointments WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS total FROM payments WHERE user_id = $1', [userId]),
      pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE user_id = $1', [userId]),
    ]);

    res.json({
      clients: clients.rows[0]?.total || 0,
      appointments: appointments.rows[0]?.total || 0,
      payments: payments.rows[0]?.total || 0,
      revenue: Number(revenue.rows[0]?.total || 0),
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    next(error);
  }
}