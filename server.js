import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import puppeteer from 'puppeteer';
import { fetchDecklogData } from './decklog-scraper.cjs';
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ⬇️ 讓 __dirname 在 ES module 可以用
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = 'deckCodes.json';

const CARDS_DIR = process.env.CARDS_DIR
  ? path.resolve(process.env.CARDS_DIR)
  : path.join(__dirname, "cards");

console.log("[Export] Using CARDS_DIR:", CARDS_DIR);

// ✅ 資料庫操作
const readDB = () => {
  try {
    if (!existsSync(DB_FILE)) return {};
    return JSON.parse(readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading DB:', error);
    return {};
  }
};

const writeDB = (data) => {
  try {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
};

// 驗證相對路徑安全性（避免 .. 跳目錄、只允許 png）
function toSafeRelPath(p) {
  if (typeof p !== "string") return null;
  if (p.includes("..")) return null;
  const normalized = p.replace(/\\/g, "/"); // 轉成 /，避免 Windows 路徑問題
  if (!/^[A-Za-z0-9_\-\/]+\.png$/.test(normalized)) return null;
  return normalized;
}

// ✅ 匯入 decklog
app.get('/import-decklog/:code', async (req, res) => {
  try {
    const data = await fetchDecklogData(req.params.code);
    console.log("📦 Scraper 抓到的結果：", JSON.stringify(data, null, 2));
    res.json(data);
  } catch (err) {
    console.error('Puppeteer error:', err);
    res.status(500).json({ error: 'Failed to fetch decklog data' });
  }
});

// ✅ 載入六碼代碼
app.get('/load/:code', (req, res) => {
  const { code } = req.params;
  const dbData = readDB();
  if (dbData[code]) {
    res.json(dbData[code]);
  } else {
    res.status(404).json({ error: 'Code not found' });
  }
});

// ✅ 儲存六碼代碼
app.post('/save/:code', (req, res) => {
  const { code } = req.params;
  const dbData = readDB();
  dbData[code] = req.body;
  writeDB(dbData);
  res.json({ success: true });
});

// 匯出圖片
app.post("/export-deck", async (req, res) => {
  try {
    const { oshi = [], deck = [], energy = [] } = req.body;

    const cardW = 90, cardH = 126, gap = 10, sectionGap = 60, maxCols = 10;
    const calcHeight = (count) => Math.ceil(count / maxCols) * (cardH + gap);
    const height = sectionGap * 4 + calcHeight(oshi.length) + calcHeight(deck.length) + calcHeight(energy.length);

    const canvas = createCanvas(1200, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 1200, height);
    ctx.font = "20px Arial"; ctx.fillStyle = "#000";

    let y = 40;

    const drawSection = async (title, cards) => {
      const total = cards.reduce((a,c)=>a+(c.count||1),0);
      ctx.fillText(`${title} (${total})`, 40, y);
      y += 26;

      for (let i=0;i<cards.length;i++) {
        const c = cards[i];
        const col = i % maxCols;
        const row = Math.floor(i / maxCols);
        const x = 40 + col * (cardW + gap);
        const posY = y + row * (cardH + gap);

        // ✅ 不再猜，直接用 folder + filename
        const folder = c.folder;
        const filename = c.filename || `${c.id}${c.version || "_C"}.png`;
        const filePath = path.join(CARDS_DIR, folder || "MISSING", filename);

        console.log("🖼 匯出圖片:", { folder, filename, filePath });

        try {
          const img = await loadImage(filePath);
          ctx.drawImage(img, x, posY, cardW, cardH);
          if (c.count > 1) {
            const boxW = 36, boxH = 22;
            const boxX = x + cardW - boxW - 4, boxY = posY + cardH - boxH - 4;
            ctx.fillStyle = "rgba(0,0,0,.7)";
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`x${c.count}`, boxX + boxW/2, boxY + boxH/2);
          }
        } catch (err) {
          console.error("❌ 載入失敗：", filePath, err.message);
          ctx.fillStyle = "red"; ctx.fillRect(x, posY, cardW, cardH);
          ctx.fillStyle = "white"; ctx.fillText("❌", x + cardW/2 - 8, posY + cardH/2 + 6);
        }
      }
      y += calcHeight(cards.length) + sectionGap - 10;
    };

    await drawSection("OSHI",   oshi);
    await drawSection("MAIN",   deck);
    await drawSection("ENERGY", energy);

    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// ✅ 啟動伺服器 (只留一個 listen)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Deck server running on http://0.0.0.0:${PORT}`);
});
