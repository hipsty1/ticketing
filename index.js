require("dotenv").config();
const express = require("express");
const path = require("path");
const adminAuth = require("./middleware/auth");
const eventRoutes = require("./routes/events");
const categoryRoutes = require("./routes/categories");
const registrationRoutes = require("./routes/registrations");
const uploadRoutes = require("./routes/uploads");
const ticketRoutes = require("./routes/tickets");

const app = express();
app.use(express.json());

// category
app.use("/api/categories", categoryRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/tickets", ticketRoutes);

// Halaman admin: wajib login
app.use("/admin", adminAuth, express.static(path.join(__dirname, "protected/admin")));

// user
app.use(express.static(path.join(__dirname, "public")));

// API event
app.use("/api/events", eventRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});