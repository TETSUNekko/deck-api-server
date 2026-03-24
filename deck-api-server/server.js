import express from 'express';
import cors from 'cors';
import { existsSync, mkdirSync } from 'fs';
import { fetchDecklogData } from './decklog-scraper.cjs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

/* ===================== 1) 全域 CORS ===================== */
const ALLOW_ORIGINS = new Set([
  'https://tetsunekko.github.io',
  'http://localhost:5173',
]);

console.log('[DEBUG] DATABASE_URL:', process.env.DATABASE_URL?.slice(0, 30));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    return cb(null, ALLOW_ORIGINS.has(origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}));
app.options('*', cors());

/* ===================== 2) 基本中介層 ===================== */
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url} Origin=${req.headers.origin || '-'}`);
  next();
});

/* ===================== 3) 路徑設定 ===================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 卡圖 CDN（Cloudflare R2）
const CARDS_CDN = process.env.CARDS_CDN || 'https://pub-9e063c0641df4849b7460815c8ee4a6d.r2.dev/cards';
console.log('[Export] Using CARDS_CDN:', CARDS_CDN);

/* ===================== 4) PostgreSQL 連線 ===================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:zpUNdxJLHVpaFeQPtXuHWjMIhOQTfoLM@ballast.proxy.rlwy.net:27575/railway',
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deck_codes (
      code      VARCHAR(10) PRIMARY KEY,
      payload   JSONB       NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('[DB] Table ready');
}

/* ===================== 5) 工具函式 ===================== */
function genShareCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function simplifyCards(cards = []) {
  const map = new Map();
  for (const c of cards) {
    if (!c?.key) continue;
    const add = Number.isFinite(c.count) ? Math.max(1, c.count | 0) : 1;
    if (!map.has(c.key)) map.set(c.key, { key: c.key, count: 0 });
    map.get(c.key).count += add;
  }
  return Array.from(map.values());
}

function parseKey(key) {
  if (!key) return null;
  const [idver, folder] = key.split('@');
  if (!idver || !folder) return null;
  const m = idver.match(/^(h[A-Za-z]+\d*-\d{3})(_[A-Za-z0-9_]+)?$/);
  if (!m) return null;
  return { id: m[1], version: m[2] || '_C', folder };
}

async function cleanExpiredCodes() {
  const result = await pool.query(
    `DELETE FROM deck_codes WHERE created_at < NOW() - INTERVAL '90 days'`
  );
  if (result.rowCount > 0) {
    console.log(`[DB] Cleaned ${result.rowCount} expired codes`);
  }
}

/* ===================== 6) 健康檢查 ===================== */
app.get('/', (req, res) => res.type('text').send('OK'));
app.get('/healthz', (req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get('/debug/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

/* ===================== 7) 六碼分享 ===================== */
app.post('/save', async (req, res) => {
  try {
    const { oshi = [], deck = [], energy = [] } = req.body || {};
    const payload = {
      oshi: simplifyCards(oshi),
      deck: simplifyCards(deck),
      energy: simplifyCards(energy),
    };

    let code = genShareCode(6);
    let guard = 0;
    while (guard++ < 50) {
      const { rows } = await pool.query('SELECT 1 FROM deck_codes WHERE code = $1', [code]);
      if (rows.length === 0) break;
      code = genShareCode(6);
    }

    await pool.query(
      'INSERT INTO deck_codes (code, payload) VALUES ($1, $2)',
      [code, JSON.stringify(payload)]
    );

    cleanExpiredCodes().catch(console.error);

    console.log('[SAVE] new share code:', code);
    res.json({ code });
  } catch (e) {
    console.error('POST /save error:', e);
    res.status(500).json({ error: 'Save failed' });
  }
});

app.post('/save/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { oshi = [], deck = [], energy = [] } = req.body || {};
    const payload = {
      oshi: simplifyCards(oshi),
      deck: simplifyCards(deck),
      energy: simplifyCards(energy),
    };
    await pool.query(
      `INSERT INTO deck_codes (code, payload)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET payload = $2, created_at = NOW()`,
      [code, JSON.stringify(payload)]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('POST /save/:code error:', e);
    res.status(500).json({ error: 'Save failed' });
  }
});

app.get('/load/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { rows } = await pool.query(
      'SELECT payload, created_at FROM deck_codes WHERE code = $1',
      [code]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Code not found' });

    const age = Date.now() - new Date(rows[0].created_at).getTime();
    if (age > 90 * 24 * 60 * 60 * 1000) {
      return res.status(404).json({ error: 'Code expired' });
    }

    return res.json(rows[0].payload);
  } catch (e) {
    console.error('GET /load/:code error:', e);
    res.status(500).json({ error: 'Load failed' });
  }
});

/* ===================== 8) 五碼 decklog 匯入 ===================== */
app.get('/import-decklog/:code', async (req, res, next) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    console.log('[/import-decklog] hit:', code);

    if (req.query.dry === '1') {
      return res.json({ oshi: [], deck: [], energy: [], _dry: true, code });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Decklog fetch timeout')), 30000)
    );
    const data = await Promise.race([fetchDecklogData(code), timeoutPromise]);

    console.log('[/import-decklog] ok', {
      oshi: data.oshi?.length || 0,
      deck: data.deck?.length || 0,
      energy: data.energy?.length || 0,
    });
    return res.json(data);
  } catch (err) {
    console.error('[/import-decklog] fail:', err?.message || err);
    return next(err);
  }
});

/* ===================== 9) 牌組圖輸出（使用 R2 CDN）===================== */
app.post('/export-deck', async (req, res, next) => {
  try {
    const { oshi = [], deck = [], energy = [] } = req.body;

    const MAX_OSHI = 1, MAX_DECK = 50, MAX_ENERGY = 20;
    if (oshi.length > MAX_OSHI || deck.length > MAX_DECK || energy.length > MAX_ENERGY) {
      return res.status(400).json({ error: 'Card count exceeds limit' });
    }

    const canvasW = 1400;
    const cardW = 140, cardH = 196, gap = 12;
    const mainCols = 7;
    const mainRows = Math.ceil((deck.length || 0) / mainCols);
    const energyRows = Math.ceil((energy.length || 0) / 2);

    const oshiTop = 60;
    const oshiBottom = oshiTop + cardH;
    const energyBaseY = oshiBottom + 80;

    const canvasH = Math.max(
      energyBaseY + energyRows * (cardH * 0.75 + gap) + 100,
      200 + mainRows * (cardH + gap)
    );

    const canvas = createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    // 背景圖從 CDN 讀取
    try {
      const bgUrl = `${CARDS_CDN}/backgrounds/wood.jpg`;
      const bgImg = await loadImage(bgUrl);
      ctx.drawImage(bgImg, 0, 0, canvasW, canvasH);
    } catch (e) {
      console.warn('⚠️ 背景載入失敗，改用灰色背景');
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    ctx.font = '20px Arial';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    async function drawCard(ctx, url, x, y, w, h, count) {
      try {
        const img = await loadImage(url);
        ctx.drawImage(img, x, y, w, h);
        if (count > 1) {
          const boxW = 40, boxH = 24;
          const boxX = x + w - boxW - 4, boxY = y + h - boxH - 4;
          ctx.fillStyle = 'rgba(0,0,0,.72)';
          ctx.fillRect(boxX, boxY, boxW, boxH);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`x${count}`, boxX + boxW / 2, boxY + boxH / 2);
        }
      } catch (err) {
        console.error('❌ 載入卡片失敗:', url, err.message);
        ctx.fillStyle = '#2a2240';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❌', x + w / 2, y + h / 2);
      }
    }

    function drawTitle(ctx, text, x, y) {
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'white';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = 'black';
      ctx.fillText(text, x, y);
    }

    // OSHI — 從 CDN 讀圖
    {
      const total = oshi.reduce((a, c) => a + (c.count || 1), 0);
      drawTitle(ctx, `OSHI (${total})`, 40, 20);
      if (oshi[0]) {
        const entry = parseKey(oshi[0].key);
        if (entry) {
          const url = `${CARDS_CDN}/${entry.folder}/${entry.id}${entry.version}.png`;
          await drawCard(ctx, url, 40, oshiTop, cardW, cardH, oshi[0].count || 1);
        }
      }
    }

    // MAIN — 從 CDN 讀圖
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
        const url = `${CARDS_CDN}/${entry.folder}/${entry.id}${entry.version}.png`;
        await drawCard(ctx, url, x, y, cardW, cardH, deck[i].count || 1);
      }
    }

    // ENERGY — 從 CDN 讀圖
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
        const url = `${CARDS_CDN}/${entry.folder}/${entry.id}${entry.version}.png`;
        await drawCard(ctx, url, x, y, smallW, smallH, energy[i].count || 1);
      }
    }

    res.setHeader('Content-Type', 'image/png');
    return canvas.pngStream().pipe(res);
  } catch (err) {
    return next(err);
  }
});

/* ===================== 10) 全域錯誤處理 ===================== */
app.use((err, req, res, next) => {
  console.error('[ERR]', err?.stack || err?.message || err);
  res.status(500).json({ error: 'Server error' });
});

/* ===================== 11) 啟動 ===================== */
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Deck server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});