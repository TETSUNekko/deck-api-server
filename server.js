import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fetchDecklogData } from './decklog-scraper.cjs';
import path from "path";
import { createCanvas, loadImage } from "canvas";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

/* ===================== 1) 全域 CORS（最前面） ===================== */
const ALLOW_ORIGINS = new Set([
  "https://tetsunekko.github.io",
  "http://localhost:5173",
]);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);               // 允許非瀏覽器（curl/內網）
    return cb(null, ALLOW_ORIGINS.has(origin));        // 嚴格白名單
  },
  methods: ["GET", "POST", "OPTIONS"],
}));

// 確保所有預檢都過（避免被瀏覽器擋）
app.options("*", cors());

/* ===================== 2) 基本中介層 ===================== */
app.use(express.json());

// 請求追蹤（方便看 Railway 的 hit 狀況）
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url} Origin=${req.headers.origin || "-"}`);
  next();
});

/* ===================== 3) 基礎變數與路徑 ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 若 Railway 有掛 Volume，請在 Railway 的環境變數設 DB_DIR=/data
const DB_DIR = process.env.DB_DIR || path.join(__dirname);
try { mkdirSync(DB_DIR, { recursive: true }); } catch {}
const DB_FILE = path.join(DB_DIR, "deckCodes.json");

// 卡圖根目錄（用於 export-deck）
const CARDS_DIR = process.env.CARDS_DIR
  ? path.resolve(process.env.CARDS_DIR)
  : path.join(__dirname, "cards");
console.log("[Export] Using CARDS_DIR:", CARDS_DIR);

/* ===================== 4) 健康檢查 ===================== */
app.get("/", (req, res) => res.type("text").send("OK"));
app.get("/healthz", (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get("/debug/ping", (req, res) => res.json({ ok: true, ts: Date.now() }));

/* ===================== 5) 小型「DB」工具 ===================== */
const readDB = () => {
  try {
    if (!existsSync(DB_FILE)) return {};
    return JSON.parse(readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading DB:', e);
    return {};
  }
};
const writeDB = (data) => {
  try {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing DB:', e);
  }
};

/* ===================== 6) 工具函式 ===================== */
function genShareCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
function simplifyCards(cards = []) {
  const map = new Map();
  for (const c of cards) {
    if (!c?.key) continue;
    const add = Number.isFinite(c.count) ? Math.max(1, c.count|0) : 1; // 預設 1，避免 0/NaN
    if (!map.has(c.key)) map.set(c.key, { key: c.key, count: 0 });
    map.get(c.key).count += add;
  }
  return Array.from(map.values());
}
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

/* ===================== 7) 路由：六碼分享 ===================== */
// 自動產生六碼（POST /save）
app.post("/save", (req, res) => {
  try {
    const { oshi = [], deck = [], energy = [] } = req.body || {};
    const payload = {
      oshi: simplifyCards(oshi),
      deck: simplifyCards(deck),
      energy: simplifyCards(energy),
    };

    const db = readDB();
    let code = genShareCode(6), guard = 0;
    while (db[code] && guard++ < 50) code = genShareCode(6);
    if (db[code]) return res.status(500).json({ error: "Generate code failed (collision)" });

    db[code] = payload;
    writeDB(db);
    console.log("[SAVE] new share code:", code);
    res.json({ code });
  } catch (e) {
    console.error("POST /save error:", e);
    res.status(500).json({ error: "Save failed" });
  }
});

// 指定六碼（POST /save/:code）
app.post('/save/:code', (req, res) => {
  const { code } = req.params;
  const { oshi = [], deck = [], energy = [] } = req.body || {};
  const payload = {
    oshi: simplifyCards(oshi),
    deck: simplifyCards(deck),
    energy: simplifyCards(energy),
  };
  const dbData = readDB();
  dbData[code] = payload;
  writeDB(dbData);
  res.json({ success: true });
});

// 讀取六碼（GET /load/:code）
app.get('/load/:code', (req, res) => {
  const { code } = req.params;
  const dbData = readDB();
  if (dbData[code]) return res.json(dbData[code]);
  return res.status(404).json({ error: 'Code not found' });
});

/* ===================== 8) 路由：五碼 decklog 匯入 ===================== */
app.get("/import-decklog/:code", async (req, res, next) => {
  try {
    const code = (req.params.code || "").trim().toUpperCase();
    console.log("[/import-decklog] hit:", code, "Origin:", req.headers.origin || "-");

    // 乾跑：用來驗證 CORS/路由/部署
    if (req.query.dry === "1") {
      return res.json({ oshi: [], deck: [], energy: [], _dry: true, code });
    }

    const data = await fetchDecklogData(code);
    console.log("[/import-decklog] ok", {
      oshi: data.oshi?.length || 0,
      deck: data.deck?.length || 0,
      energy: data.energy?.length || 0,
    });
    return res.json(data);
  } catch (err) {
    console.error("[/import-decklog] fail:", err?.message || err);
    return next(err); // 交給全域錯誤處理器（會帶 CORS）
  }
});

/* ===================== 9) 路由：牌組圖輸出（export-deck） ===================== */
app.post("/export-deck", async (req, res, next) => {
  try {
    const { oshi = [], deck = [], energy = [] } = req.body;

    const canvasW = 1400;
    const cardW = 140, cardH = 196, gap = 12;
    const mainCols = 7;
    const mainRows = Math.ceil((deck.length || 0) / mainCols);
    const energyCols = 2;
    const energyRows = Math.ceil((energy.length || 0) / energyCols);

    const oshiTop = 60;
    const oshiBottom = oshiTop + cardH;
    const energyBaseY = oshiBottom + 80;

    const canvasH = Math.max(
      energyBaseY + energyRows * (cardH * 0.75 + gap) + 100,
      200 + mainRows * (cardH + gap)
    );

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext("2d");

    try {
      const bgPath = path.join(CARDS_DIR, "backgrounds", "wood.jpg");
      const bgImg = await loadImage(bgPath);
      ctx.drawImage(bgImg, 0, 0, canvasW, canvasH);
    } catch (e) {
      console.warn("⚠️ 背景載入失敗:", e.message, "→ 改用灰色背景");
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    ctx.font = "20px Arial";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

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
      } catch (err) {
        console.error("❌ 載入卡片失敗:", filePath, err.message);
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("❌", x + w / 2, y + h / 2);
      }
    }

    function drawTitle(ctx, text, x, y) {
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.lineJoin = "round";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "white";
      ctx.strokeText(text, x, y);
      ctx.fillStyle = "black";
      ctx.fillText(text, x, y);
    }

    // OSHI
    {
      const total = oshi.reduce((a, c) => a + (c.count || 1), 0);
      drawTitle(ctx, `OSHI (${total})`, 40, 20);

      if (oshi[0]) {
        const entry = parseKey(oshi[0].key);
        if (entry) {
          const filename = `${entry.id}${entry.version}.png`;
          const filePath = path.join(CARDS_DIR, entry.folder || "MISSING", filename);
          await drawCard(ctx, filePath, 40, oshiTop, cardW, cardH, oshi[0].count || 1);
        }
      }
    }

    // MAIN
    {
      const total = deck.reduce((a, c) => a + (c.count || 1), 0);
      drawTitle(ctx, `MAIN (${total})`, 300, 20);

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

    // ENERGY
    {
      const total = energy.reduce((a, c) => a + (c.count || 1), 0);
      drawTitle(ctx, `ENERGY (${total})`, 40, energyBaseY);

      const smallW = 110, smallH = 155;
      for (let i = 0; i < energy.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 40 + col * (smallW + gap);
        const y = energyBaseY + 40 + row * (smallH + gap);

        const entry = parseKey(energy[i].key);
        if (!entry) continue;
        const filename = `${entry.id}${entry.version}.png`;
        const filePath = path.join(CARDS_DIR, entry.folder || "MISSING", filename);
        await drawCard(ctx, filePath, x, y, smallW, smallH, energy[i].count || 1);
      }
    }

    res.setHeader("Content-Type", "image/png");
    return canvas.pngStream().pipe(res);
  } catch (err) {
    return next(err);
  }
});

/* ===================== 10) 全域錯誤處理（也會帶 CORS） ===================== */
app.use((err, req, res, next) => {
  console.error("[ERR]", err?.stack || err?.message || err);
  // 若需要可根據 ALLOW_ORIGINS 手動補 header，但 cors() 通常已處理
  res.status(500).json({ error: "Server error" });
});

/* ===================== 11) 啟動 ===================== */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Deck server running on http://0.0.0.0:${PORT}`);
});
