const express = require("express");
const pool = require("../db");
const adminAuth = require("../middleware/auth");
const router = express.Router();

// GET semua kategori (dipakai untuk dropdown)
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT id, nama FROM categories ORDER BY nama");
  res.json(result.rows);
});

router.post("/", adminAuth, async (req, res) => {
  const nama = typeof req.body?.nama === "string" ? req.body.nama.trim() : "";
  if (!nama) {
    return res.status(400).json({ error: "Nama kategori wajib diisi" });
  }

  const existing = await pool.query(
    "SELECT id FROM categories WHERE LOWER(nama) = LOWER($1)",
    [nama]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Kategori sudah ada" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO categories (nama) VALUES ($1) RETURNING id, nama",
      [nama]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Kategori sudah ada" });
    }
    throw error;
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kategori tidak ditemukan" });
    }
    res.json({ message: "Kategori dihapus" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({ error: "Kategori masih digunakan oleh event" });
    }
    throw error;
  }
});

module.exports = router;