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
  const { oshi = [], deck = [], energy = [] } = req.body;

  // 🔑 把每張卡壓縮成 {key, count}
  const simplify = (cards) => {
    const map = new Map();
    for (const c of cards) {
      if (!c.key) continue; // 沒 key 的跳過
      if (!map.has(c.key)) {
        map.set(c.key, { key: c.key, count: 0 });
      }
      map.get(c.key).count++;
    }
    return Array.from(map.values());
  };

  const payload = {
    oshi: simplify(oshi),
    deck: simplify(deck),
    energy: simplify(energy),
  };

  const dbData = readDB();
  dbData[code] = payload;  // ✅ 存的就是乾淨的 key-based 結構
  writeDB(dbData);

  res.json({ success: true });
});

// ✅ 後端專用 parseKey（和前端一致）
function parseKey(key) {
  if (!key) return null;
  const [idver, folder] = key.split("@");
  if (!idver || !folder) return null;

  const m = idver.match(/^(h[A-Za-z]+\d*-\d{3})(_[A-Za-z0-9_]+)?$/);
  if (!m) return null;

  const id = m[1];
  const version = m[2] || "_C";
  return { id, version, folder };
}

// 匯出圖片
app.post("/export-deck", async (req, res) => {
  try {
    const { oshi = [], deck = [], energy = [] } = req.body;

    // --- utils ---------------------------------------------------
    function parseKey(key) {
      if (!key) return null;
      const [idver, folder] = key.split("@");
      if (!idver || !folder) return null;
      const m = idver.match(/^(h[A-Za-z]+\d*-\d{3})(.*)$/);
      if (!m) return null;
      return { id: m[1], version: m[2] || "_C", folder };
    }

    async function drawCard(ctx, filePath, x, y, w, h, count) {
      try {
        const img = await loadImage(filePath);
        ctx.drawImage(img, x, y, w, h);
        if (count > 1) {
          const boxW = 40, boxH = 24;
          const boxX = x + w - boxW - 4, boxY = y + h - boxH - 4;
          ctx.fillStyle = "rgba(0,0,0,.72)";
          ctx.fillRect(boxX, boxY, boxW, boxH);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 16px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`x${count}`, boxX + boxW / 2, boxY + boxH / 2);
        }
      } catch {
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("❌", x + w / 2, y + h / 2);
      }
    }

    // --- layout config -------------------------------------------
    const canvasW = 1400;
    const cardW = 140, cardH = 196, gap = 12;

    const mainCols = 7; // MAIN 一列 7 張
    const mainRows = Math.ceil((deck.length || 0) / mainCols);
    const energyCols = 2; // ENERGY 每列 2 張
    const energyRows = Math.ceil((energy.length || 0) / energyCols);

    const canvasH = Math.max(
      400 + energyRows * (cardH + gap),   // 左邊大概高度
      200 + mainRows * (cardH + gap)      // 右邊大概高度
    );

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    gradient.addColorStop(0, "#f0f0f0");  // 上灰
    gradient.addColorStop(1, "#ffffff");  // 下白
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    // --- OSHI（左上） --------------------------------------------
    {
      const total = oshi.reduce((a, c) => a + (c.count || 1), 0);
      ctx.fillText(`OSHI (${total})`, 40, 40);

      if (oshi[0]) {
        const entry = parseKey(oshi[0].key);
        if (entry) {
          const filename = `${entry.id}${entry.version}.png`;
          const filePath = path.join(CARDS_DIR, entry.folder || "MISSING", filename);
          await drawCard(ctx, filePath, 40, 60, cardW, cardH, oshi[0].count || 1);
        }
      }
    }

    // --- MAIN（右側） --------------------------------------------
    {
      const total = deck.reduce((a, c) => a + (c.count || 1), 0);
      ctx.fillText(`MAIN (${total})`, 300, 40);

      for (let i = 0; i < deck.length; i++) {
        const col = i % mainCols;
        const row = Math.floor(i / mainCols);
        const x = 300 + col * (cardW + gap);
        const y = 60 + row * (cardH + gap);

        const entry = parseKey(deck[i].key);
        if (!entry) continue;
        const filename = `${entry.id}${entry.version}.png`;
        const filePath = path.join(CARDS_DIR, entry.folder || "MISSING", filename);
        await drawCard(ctx, filePath, x, y, cardW, cardH, deck[i].count || 1);
      }
    }

    // --- ENERGY（左下） ------------------------------------------
    {
      const total = energy.reduce((a, c) => a + (c.count || 1), 0);
      const titleX = 40;
      const titleY = 40 + cardH + 50; // OSHI 下方再空一段
      ctx.fillText(`ENERGY (${total})`, titleX, titleY);

      for (let i = 0; i < energy.length; i++) {
        const col = i % energyCols;
        const row = Math.floor(i / energyCols);
        const x = 40 + col * (100 + gap);
        const y = cardH + 140 + row * (142 + gap);

        const entry = parseKey(energy[i].key);
        if (!entry) continue;
        const filename = `${entry.id}${entry.version}.png`;
        const filePath = path.join(CARDS_DIR, entry.folder || "MISSING", filename);
        await drawCard(ctx, filePath, x, y, 100, 142, energy[i].count || 1); //100 和 142 就是 能量卡的寬、高。
      }
    }

    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// ✅ 啟動伺服器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Deck server running on http://0.0.0.0:${PORT}`);
});
