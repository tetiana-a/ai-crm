import { pool } from '../config/db.js';

export async function getPayments(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_date DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createPayment(req, res, next) {
  try {
    const { client_id, amount, method, note } = req.body;
    if (!amount) return res.status(400).json({ message: 'Amount is required' });

    const result = await pool.query(
      'INSERT INTO payments (user_id, client_id, amount, method, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, client_id || null, amount, method || 'cash', note || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
