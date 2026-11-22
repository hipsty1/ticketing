const express = require("express");
const pool = require("../db");
const router = express.Router();
const adminAuth = require("../middleware/auth");

// GET semua event
router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT events.*, categories.nama AS kategori FROM events LEFT JOIN categories ON categories.id = events.category_id ORDER BY events.tanggal"
  );
  res.json(result.rows);
});

// GET satu event
router.get("/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT events.*, categories.nama AS kategori FROM events LEFT JOIN categories ON categories.id = events.category_id WHERE events.id = $1",
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(result.rows[0]);
});

// POST event baru
router.post("/", adminAuth, async (req, res) => {
  const { nama, deskripsi, tanggal, lokasi, kapasitas, harga, category_id, image_url } = req.body;
  if (!nama || !tanggal || !lokasi || !kapasitas) {
    return res.status(400).json({ error: "Data wajib belum lengkap" });
  }
  const categoryId = category_id ? Number(category_id) : null;
  if (category_id && (!Number.isInteger(categoryId) || categoryId < 1)) {
    return res.status(400).json({ error: "Kategori tidak valid" });
  }
  const result = await pool.query(
    "INSERT INTO events (nama, deskripsi, tanggal, lokasi, kapasitas, harga, category_id, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
    [nama, deskripsi, tanggal, lokasi, kapasitas, harga || 0, categoryId, image_url || null]
  );
  res.status(201).json(result.rows[0]);
});

// PUT ubah event
router.put("/:id", adminAuth, async (req, res) => {
  const { nama, deskripsi, tanggal, lokasi, kapasitas, harga, category_id, image_url } = req.body;
  const categoryId = category_id ? Number(category_id) : null;
  if (category_id && (!Number.isInteger(categoryId) || categoryId < 1)) {
    return res.status(400).json({ error: "Kategori tidak valid" });
  }
  const result = await pool.query(
    "UPDATE events SET nama=$1, deskripsi=$2, tanggal=$3, lokasi=$4, kapasitas=$5, harga=$6, category_id=$7, image_url=$8 WHERE id=$9 RETURNING *",
    [nama, deskripsi, tanggal, lokasi, kapasitas, harga || 0, categoryId, image_url || null, req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(result.rows[0]);
});

// DELETE event
router.delete("/:id", adminAuth, async (req, res) => {
  const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING id", [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json({ message: "Event dihapus" });
});

module.exports = router;