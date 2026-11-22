const express = require("express");
const pool = require("../db");
const QRCode = require("qrcode");
const router = express.Router();

router.get("/:kode/qr", async (req, res) => {
  const { kode } = req.params;
  const result = await pool.query(
    "SELECT 1 FROM tickets WHERE kode_tiket = $1",
    [kode]
  );

  if (result.rows.length === 0) {
    return res.status(404).send("Tiket tidak ditemukan");
  }

  const qrBuffer = await QRCode.toBuffer(kode, { type: "png" });
  res.type("png").send(qrBuffer);
});

module.exports = router;
