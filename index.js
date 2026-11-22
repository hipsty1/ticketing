require("dotenv").config();
const express = require("express");
const eventRoutes = require("./routes/events");

const app = express();
app.use(express.json()); // membaca body JSON dari request
app.use("/api/events", eventRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});