import { pool } from '../config/db.js';
import { sendTelegramMessage } from '../services/telegramService.js';
import { triggerN8nReminder } from '../services/n8nService.js';

export async function getAppointments(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.*, c.full_name AS client_name
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       WHERE a.user_id = $1
       ORDER BY a.appointment_date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const { client_id, service_name, appointment_date, status } = req.body;
    if (!client_id || !service_name || !appointment_date) {
      return res.status(400).json({ message: 'client_id, service_name and appointment_date are required' });
    }

    const result = await pool.query(
      `INSERT INTO appointments (user_id, client_id, service_name, appointment_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, client_id, service_name, appointment_date, status || 'booked']
    );

    const appointment = result.rows[0];
    await sendTelegramMessage(`New appointment created: ${service_name} at ${appointment_date}`);
    await triggerN8nReminder({ type: 'appointment_created', userId: req.user.id, appointment });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}
