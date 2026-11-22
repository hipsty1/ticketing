const express = require("express");
const pool = require("../db");
const router = express.Router();

router.post("/", async (req, res) => {
  const { event_id, nama, email, telepon } = req.body || {};
  const eventId = Number(event_id);

  if (!Number.isInteger(eventId) || eventId < 1) {
    return res.status(400).json({ error: "ID event tidak valid" });
  }

  if (
    typeof nama !== "string" ||
    !nama.trim() ||
    nama.trim().length > 100 ||
    typeof email !== "string" ||
    !email.trim() ||
    email.trim().length > 150 ||
    (telepon != null && typeof telepon !== "string") ||
    (typeof telepon === "string" && telepon.trim().length > 30)
  ) {
    return res.status(400).json({ error: "Data pendaftaran tidak valid" });
  }

  const event = await pool.query(
    "SELECT id FROM events WHERE id = $1",
    [eventId]
  );
  if (event.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }

  const result = await pool.query(
    "INSERT INTO registrations (event_id, nama, email, telepon) VALUES ($1, $2, $3, $4) RETURNING id, event_id, nama, email, telepon, created_at",
    [eventId, nama.trim(), email.trim(), telepon ? telepon.trim() : null]
  );

  res.status(201).json(result.rows[0]);
});

module.exports = router;
