require("dotenv").config();
const express = require("express");
const path = require("path");
const adminAuth = require("./middleware/auth");
const eventRoutes = require("./routes/events");

const app = express();
app.use(express.json());

// Halaman admin: wajib login
app.use("/admin", adminAuth, express.static(path.join(__dirname, "protected/admin")));

// API event
app.use("/api/events", eventRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});