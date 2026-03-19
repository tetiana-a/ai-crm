import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const q = (req.query.q || "").trim();

    let result;

    if (q) {
      result = await pool.query(
        `
        SELECT *
        FROM clients
        WHERE user_id = $1
          AND (
            full_name ILIKE $2
            OR phone ILIKE $2
            OR email ILIKE $2
            OR messenger ILIKE $2
            OR notes ILIKE $2
          )
        ORDER BY created_at DESC
        `,
        [userId, `%${q}%`]
      );
    } else {
      result = await pool.query(
        `
        SELECT *
        FROM clients
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
      );
    }

    return res.json(result.rows);
  } catch (error) {
    console.error("GET CLIENTS ERROR:", error);
    return res.status(500).json({ message: "Server error fetching clients" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = Number(req.params.id);

    if (!clientId) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM clients
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [clientId, userId]
    );

    const client = result.rows[0];

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json(client);
  } catch (error) {
    console.error("GET CLIENT ERROR:", error);
    return res.status(500).json({ message: "Server error fetching client" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, email, messenger, notes } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: "Client name is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO clients (user_id, full_name, phone, email, messenger, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        userId,
        full_name.trim(),
        phone || null,
        email || null,
        messenger || null,
        notes || null,
      ]
    );

    return res.status(201).json({
      message: "Client created successfully",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE CLIENT ERROR:", error);
    return res.status(500).json({ message: "Server error creating client" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = Number(req.params.id);
    const { full_name, phone, email, messenger, notes } = req.body;

    if (!clientId) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: "Client name is required" });
    }

    const result = await pool.query(
      `
      UPDATE clients
      SET
        full_name = $1,
        phone = $2,
        email = $3,
        messenger = $4,
        notes = $5
      WHERE id = $6 AND user_id = $7
      RETURNING *
      `,
      [
        full_name.trim(),
        phone || null,
        email || null,
        messenger || null,
        notes || null,
        clientId,
        userId,
      ]
    );

    const updatedClient = result.rows[0];

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json({
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("UPDATE CLIENT ERROR:", error);
    return res.status(500).json({ message: "Server error updating client" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = Number(req.params.id);

    if (!clientId) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    const result = await pool.query(
      `
      DELETE FROM clients
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [clientId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("DELETE CLIENT ERROR:", error);
    return res.status(500).json({ message: "Server error deleting client" });
  }
});

export default router;
