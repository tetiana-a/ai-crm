import { pool } from '../config/db.js';

export async function getClients(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createClient(req, res, next) {
  try {
    const { full_name, phone, messenger, notes } = req.body;
    if (!full_name) return res.status(400).json({ message: 'Full name is required' });

    const result = await pool.query(
      'INSERT INTO clients (user_id, full_name, phone, messenger, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, full_name, phone || '', messenger || '', notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
