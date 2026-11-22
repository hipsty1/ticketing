require("dotenv").config();
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Server jalan!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});