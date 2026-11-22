const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET semua kategori (dipakai untuk dropdown)
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT id, nama FROM categories ORDER BY nama");
  res.json(result.rows);
});

module.exports = router;