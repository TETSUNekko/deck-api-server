// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "deckData.json");

// 儲存代碼與牌組
app.post("/save", (req, res) => {
  const { code, payload } = req.body;
  if (!code || !payload) return res.status(400).send("Missing data");

  let data = {};
  if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  data[code] = payload;

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.status(200).send("Saved");
});

// 讀取代碼
app.get("/load/:code", (req, res) => {
  const code = req.params.code;
  if (!fs.existsSync(DATA_FILE)) return res.status(404).send("Not found");

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const deck = data[code];
  if (!deck) return res.status(404).send("Code not found");

  res.status(200).json(deck);
});

app.listen(PORT, () => {
  console.log(`Deck server running on http://localhost:${PORT}`);
});
