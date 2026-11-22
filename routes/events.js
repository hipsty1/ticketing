const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET semua event
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM events ORDER BY tanggal");
  res.json(result.rows);
});

// GET satu event
router.get("/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM events WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(result.rows[0]);
});

// POST event baru
router.post("/", async (req, res) => {
  const { nama, deskripsi, tanggal, lokasi, kapasitas, harga } = req.body;
  if (!nama || !tanggal || !lokasi || !kapasitas) {
    return res.status(400).json({ error: "Data wajib belum lengkap" });
  }
  const result = await pool.query(
    "INSERT INTO events (nama, deskripsi, tanggal, lokasi, kapasitas, harga) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [nama, deskripsi, tanggal, lokasi, kapasitas, harga || 0]
  );
  res.status(201).json(result.rows[0]);
});

// PUT ubah event
router.put("/:id", async (req, res) => {
  const { nama, deskripsi, tanggal, lokasi, kapasitas, harga } = req.body;
  const result = await pool.query(
    "UPDATE events SET nama=$1, deskripsi=$2, tanggal=$3, lokasi=$4, kapasitas=$5, harga=$6 WHERE id=$7 RETURNING *",
    [nama, deskripsi, tanggal, lokasi, kapasitas, harga || 0, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(result.rows[0]);
});

// DELETE event
router.delete("/:id", async (req, res) => {
  const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING id", [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json({ message: "Event dihapus" });
});

module.exports = router;