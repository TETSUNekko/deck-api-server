const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "deckData.json");
const EXPIRATION_TIME = 90 * 24 * 60 * 60 * 1000; // 90 天（毫秒）

// 🧹 清除過期資料
function cleanExpiredData() {
  if (!fs.existsSync(DATA_FILE)) return;

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const now = Date.now();
  const filteredData = {};

  for (const [code, deck] of Object.entries(data)) {
    if (!deck.timestamp || now - deck.timestamp <= EXPIRATION_TIME) {
      filteredData[code] = deck;
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(filteredData, null, 2));
}

// 儲存代碼與牌組
app.post("/save", (req, res) => {
  const { code, payload } = req.body;
  if (!code || !payload) return res.status(400).send("Missing data");

  let data = {};
  if (fs.existsSync(DATA_FILE)) {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }

  // 加入 timestamp 並儲存
  data[code] = {
    ...payload,
    timestamp: Date.now()
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  cleanExpiredData(); // 每次儲存時也清一次
  res.status(200).send("Saved");
});

// 讀取代碼
app.get("/load/:code", (req, res) => {
  const code = req.params.code;
  if (!fs.existsSync(DATA_FILE)) return res.status(404).send("Not found");

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const deck = data[code];
  if (!deck) return res.status(404).send("Code not found");

  const now = Date.now();
  if (deck.timestamp && now - deck.timestamp > EXPIRATION_TIME) {
    return res.status(404).send("Code expired");
  }

  res.status(200).json(deck);
});

app.listen(PORT, () => {
  cleanExpiredData(); // 🧼 啟動時清理一次
  console.log(`Deck server running on http://localhost:${PORT}`);
});
