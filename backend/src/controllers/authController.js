import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, preferred_language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, preferred_language) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, preferred_language',
      [name, email, passwordHash, preferred_language || 'en']
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, role: user.role, preferred_language: user.preferred_language });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user.id, email: user.email, role: user.role, preferred_language: user.preferred_language };
    const token = signToken(payload);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, preferred_language: user.preferred_language },
      token
    });
  } catch (error) {
    next(error);
  }
}
