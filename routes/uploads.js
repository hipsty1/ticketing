const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const adminAuth = require("../middleware/auth");
const router = express.Router();

const uploadDir = path.join(__dirname, "../public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, crypto.randomBytes(16).toString("hex") + extension);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // maksimal 2 MB
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes[extension] === file.mimetype);
  },
});

router.post("/", adminAuth, (req, res) => {
  upload.single("gambar")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ error: "File tidak valid atau ukurannya melebihi 2 MB" });
    }
    if (error) {
      return res.status(400).json({ error: "Gagal memproses file gambar" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Pilih gambar JPG, JPEG, PNG, atau WebP" });
    }
    res.status(201).json({ url: "/uploads/" + req.file.filename });
  });
});

module.exports = router;