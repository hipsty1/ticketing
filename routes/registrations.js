const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const { kirimTiket } = require("../services/email");
const router = express.Router();

router.post("/", async (req, res) => {
  const { event_id, nama, email, telepon } = req.body || {};
  const eventId = Number(event_id);
  const namaBersih = typeof nama === "string" ? nama.trim() : "";
  const emailBersih = typeof email === "string" ? email.trim() : "";
  const teleponBersih = typeof telepon === "string" ? telepon.trim() : null;

  if (
    !Number.isInteger(eventId) ||
    eventId < 1 ||
    !namaBersih ||
    namaBersih.length > 100 ||
    !emailBersih ||
    !emailBersih.includes("@") ||
    emailBersih.length > 150 ||
    (telepon != null && typeof telepon !== "string") ||
    (teleponBersih && teleponBersih.length > 30)
  ) {
    return res.status(400).json({ error: "Data pendaftaran tidak valid" });
  }

  const event = await pool.query(
    "SELECT events.id, events.nama, events.deskripsi, events.tanggal, events.lokasi, events.harga, events.image_url, categories.nama AS kategori FROM events LEFT JOIN categories ON categories.id = events.category_id WHERE events.id = $1",
    [eventId]
  );
  if (event.rows.length === 0) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  const detailEvent = event.rows[0];

  const client = await pool.connect();
  let transaksiAktif = false;
  let registrationId;
  const kodeTiket = crypto.randomUUID();

  try {
    await client.query("BEGIN");
    transaksiAktif = true;

    const registration = await client.query(
      "INSERT INTO registrations (event_id, nama, email, telepon) VALUES ($1, $2, $3, $4) RETURNING id",
      [eventId, namaBersih, emailBersih, teleponBersih || null]
    );
    registrationId = registration.rows[0].id;

    await client.query(
      "INSERT INTO tickets (registration_id, kode_tiket) VALUES ($1, $2)",
      [registrationId, kodeTiket]
    );

    await client.query("COMMIT");
    transaksiAktif = false;
  } catch (error) {
    if (transaksiAktif) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Gagal melakukan rollback pendaftaran:", rollbackError);
      }
    }
    throw error;
  } finally {
    client.release();
  }

  try {
    await kirimTiket(emailBersih, namaBersih, kodeTiket, detailEvent);
  } catch (error) {
    console.error("Pendaftaran tersimpan, tetapi email tiket gagal dikirim:", error);
  }

  res.status(201).json({ id: registrationId, kode_tiket: kodeTiket });
});

module.exports = router;
