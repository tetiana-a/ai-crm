import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/telegram-link-code', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  await pool.query(
    `UPDATE users SET telegram_code = $1 WHERE id = $2`,
    [code, userId]
  );

  res.json({ code });
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, preferred_language } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, preferred_language)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, preferred_language, role, created_at
      `,
      [
        name || null,
        email.toLowerCase(),
        password_hash,
        preferred_language || "en",
      ]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ message: "Server error during register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, password_hash, preferred_language, role, created_at
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferred_language: user.preferred_language,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email, preferred_language, role, created_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("ME ERROR:", error);
    return res.status(500).json({ message: "Server error fetching user" });
  }
});

export default router;
