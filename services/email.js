const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const fs = require("fs/promises");
const path = require("path");

const smtpPort = Number(process.env.SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function bacaLampiranGambarEvent(imageUrl) {
  const match = typeof imageUrl === "string"
    ? imageUrl.match(/^\/uploads\/([A-Za-z0-9._-]+)$/)
    : null;
  if (!match) return null;

  const filename = match[1];
  const extension = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  if (!contentTypes[extension]) return null;

  try {
    const content = await fs.readFile(path.join(__dirname, "..", "public", "uploads", filename));
    return {
      filename,
      content,
      contentType: contentTypes[extension],
      cid: "gambar-event",
    };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function kirimTiket(email, nama, kode, event = {}) {
  const qrBuffer = await QRCode.toBuffer(kode, { type: "png" });
  const lampiranGambarEvent = await bacaLampiranGambarEvent(event.image_url);
  const namaEvent = event.nama || "Event";
  const kategori = event.kategori || "Tidak ditentukan";
  const tanggal = event.tanggal
    ? new Date(event.tanggal).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })
    : "Tidak ditentukan";
  const lokasi = event.lokasi || "Tidak ditentukan";
  const deskripsi = event.deskripsi || "Tidak ada deskripsi tambahan.";
  const harga = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(event.harga) || 0);
  const instruksiPenukaran = [
    "Tunjukkan QR code atau kode tiket ini kepada petugas di pintu masuk.",
    "Petugas akan memindai QR code untuk memvalidasi tiket.",
    "Gunakan tiket satu kali dan jangan membagikan QR code kepada orang lain.",
  ];

  const attachments = [
    {
      filename: "qr-tiket.png",
      content: qrBuffer,
      contentType: "image/png",
      cid: "qr-tiket",
    },
  ];
  if (lampiranGambarEvent) {
    attachments.push(lampiranGambarEvent);
  }

  const headerGambar = lampiranGambarEvent
    ? `<img src="cid:gambar-event" alt="${escapeHtml(namaEvent)}" style="display:block;width:100%;max-height:260px;object-fit:cover;border:0;">`
    : `<div style="padding:48px 24px;background:#1f2937;color:#ffffff;text-align:center;font-size:24px;font-weight:bold;">${escapeHtml(namaEvent)}</div>`;
  const instruksiHtml = instruksiPenukaran
    .map((instruksi) => `<li style="margin:0 0 8px;">${escapeHtml(instruksi)}</li>`)
    .join("");

  await transporter.sendMail({
    from: `Ticketing <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Tiket Anda",
    text: [
      `Halo ${nama},`,
      "",
      `Tiket Anda untuk ${namaEvent} sudah terbit.`,
      `Kode tiket: ${kode}`,
      `Kategori: ${kategori}`,
      `Tanggal: ${tanggal}`,
      `Lokasi: ${lokasi}`,
      `Harga: ${harga}`,
      `Deskripsi: ${deskripsi}`,
      "",
      "Cara menukarkan tiket:",
      ...instruksiPenukaran.map((instruksi, index) => `${index + 1}. ${instruksi}`),
      "",
      "QR code tiket terlampir.",
    ].join("\n"),
    html: `
      <div style="margin:0;padding:24px;background:#f4f4f4;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:640px;margin:0 auto;overflow:hidden;border:2px solid #111827;border-radius:8px;background:#ffffff;">
          ${headerGambar}
          <div style="padding:28px 24px;">
            <p style="margin:0 0 8px;color:#4b5563;">TIKET ANDA SUDAH TERBIT</p>
            <h1 style="margin:0 0 16px;font-size:28px;color:#111827;">${escapeHtml(namaEvent)}</h1>
            <p style="margin:0 0 20px;">Halo ${escapeHtml(nama)}, simpan email ini dan tunjukkan QR code saat kedatangan.</p>

            <div style="margin:0 0 20px;padding:16px;border:1px dashed #6b7280;border-radius:6px;text-align:center;">
              <p style="margin:0 0 8px;color:#4b5563;">KODE TIKET</p>
              <strong style="font-size:18px;overflow-wrap:anywhere;">${escapeHtml(kode)}</strong>
            </div>

            <h2 style="margin:0 0 12px;font-size:18px;">Detail event</h2>
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#4b5563;">Kategori</td><td style="padding:6px 0;text-align:right;">${escapeHtml(kategori)}</td></tr>
              <tr><td style="padding:6px 0;color:#4b5563;">Tanggal</td><td style="padding:6px 0;text-align:right;">${escapeHtml(tanggal)}</td></tr>
              <tr><td style="padding:6px 0;color:#4b5563;">Lokasi</td><td style="padding:6px 0;text-align:right;">${escapeHtml(lokasi)}</td></tr>
              <tr><td style="padding:6px 0;color:#4b5563;">Harga</td><td style="padding:6px 0;text-align:right;">${escapeHtml(harga)}</td></tr>
            </table>
            <p style="margin:14px 0 24px;line-height:1.5;">${escapeHtml(deskripsi)}</p>

            <h2 style="margin:0 0 12px;font-size:18px;">Cara menukarkan tiket</h2>
            <ol style="margin:0 0 24px;padding-left:22px;line-height:1.5;">${instruksiHtml}</ol>

            <div style="text-align:center;">
              <p style="margin:0 0 12px;font-weight:bold;">QR code tiket</p>
              <img src="cid:qr-tiket" alt="QR code tiket" width="220" height="220" style="display:inline-block;width:220px;height:220px;">
            </div>
          </div>
        </div>
      </div>
    `,
    attachments,
  });
}

module.exports = { kirimTiket };
