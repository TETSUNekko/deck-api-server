// decklog-scraper.cjs  — CommonJS 版本，移除 page.waitForTimeout

const puppeteer = require("puppeteer");

const DECKLOG_URLS = [
  (code) => `https://decklog-en.bushiroad.com/ja/view/${code}`, // 國際站優先
  (code) => `https://decklog.bushiroad.com/view/${code}`,        // 日本站備用
];

// 小工具：sleep 取代 page.waitForTimeout
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 小工具：頁面自動下捲，觸發 lazy-render/lazy-load
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const distance = 600;
      const timer = setInterval(() => {
        const { scrollHeight } = document.scrollingElement || document.documentElement;
        window.scrollBy(0, distance);
        total += distance;
        if (total >= scrollHeight - window.innerHeight - 100) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

// 小工具：若站上有「同意」按鈕，試點一下
async function clickConsentIfAny(page) {
  try {
    const btn = await page.$('button:has-text("同意"), button:has-text("Agree"), #onetrust-accept-btn-handler');
    if (btn) await btn.click();
  } catch {}
}

// 小工具：基本偽裝（User-Agent、webdriver 等）
async function applyStealth(page) {
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
  });
  await page.evaluateOnNewDocument(() => {
    // 隱藏 webdriver
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // 假裝有 plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3],
    });
    // 假裝有 languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["ja-JP", "ja", "en-US", "en"],
    });
    // WebGL vendor/renderer
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return "Intel Inc.";
      if (param === 37446) return "Intel(R) Iris(TM) Graphics 6100";
      return getParameter.apply(this, [param]);
    };
  });
}

// 主要：用 DOM selector 精準解析（最佳）
async function tryReadDeck(page) {
  const sections = await page.$$("h3");
  let hasOshi = false, hasMain = false, hasEnergy = false;
  const oshi = [], deck = [], energy = [];

  const parseCardsFromSectionHandle = async (h3Handle) => {
    if (!h3Handle) return [];

    const container = await page.evaluateHandle((h3) => {
      let sib = h3.nextElementSibling;
      while (sib) {
        if (sib.querySelector(".card-view-item, img, .card-container")) return sib;
        sib = sib.nextElementSibling;
      }
      return null;
    }, h3Handle);

    if (!container) return [];

    const cardImgs = await container.$$("[data-src], img");
    const results = [];

    for (const img of cardImgs) {
      const { src, title } = await img.evaluate((el) => ({
        src: el.getAttribute("data-src") || el.getAttribute("src") || "",
        title: el.getAttribute("title") || "",
      }));

      if (!src) continue;
      const filename = src.split("/").pop().replace(".png", "");
      // filename 例如 "hBP02-084_02_U"
      const m = filename.match(/^(h[A-Za-z]+\d*-\d{3})(.*)$/);
      if (!m) continue;

      const id = m[1];
      const version = m[2] || "_C";

      // 數量
      const cnt = await img.evaluate((el) => {
        const cont = el.closest(".card-container");
        const num = cont && cont.querySelector(".card-controller-inner .num");
        return num ? parseInt(num.textContent.trim(), 10) : 1;
      });

      results.push({ id, version, count: isNaN(cnt) ? 1 : cnt });
    }
    return results;
  };

  // 嘗試抓出「推し / Main Deck / Energy」的 h3
  let h3Oshi = null, h3Main = null, h3Energy = null;
  for (const h of sections) {
    const text = (await (await h.getProperty("textContent")).jsonValue()) || "";
    if (/推しホロメン|Oshi/i.test(text)) h3Oshi = h;
    if (/メインデッキ|Main Deck/i.test(text)) h3Main = h;
    if (/エールデッキ|“エール” Deck|Energy/i.test(text)) h3Energy = h;
  }

  if (h3Oshi) { hasOshi = true; oshi.push(...(await parseCardsFromSectionHandle(h3Oshi))); }
  if (h3Main) { hasMain = true; deck.push(...(await parseCardsFromSectionHandle(h3Main))); }
  if (h3Energy){ hasEnergy = true; energy.push(...(await parseCardsFromSectionHandle(h3Energy))); }

  return {
    foundHeadings: { oshi: hasOshi, main: hasMain, energy: hasEnergy },
    oshi, deck, energy
  };
}

// 後備：直接用 HTML 文字粗略抓圖檔（無法分區；全部塞 deck）
async function extractLooseByHTML(page) {
  const html = await page.content();
  const re = /\/cardlist\/[^/]+\/[^/]+\/(h[A-Za-z]+\d*-\d{3}(_[A-Za-z0-9_]+)?)\.png/gi;
  const set = new Map();
  let m;
  while ((m = re.exec(html))) {
    const full = m[1]; // e.g. hBP02-084_02_U 或 hBP02-084
    const idMatch = full.match(/^(h[A-Za-z]+\d*-\d{3})(.*)$/);
    if (!idMatch) continue;
    const id = idMatch[1];
    const version = idMatch[2] || "_C";
    const key = `${id}${version}`;
    set.set(key, { id, version, count: 1 });
  }
  const arr = Array.from(set.values());
  return {
    viaHeading: false,
    deck: arr,
    total: arr.length
  };
}

async function fetchDecklogData(deckCode) {
  let browser;

  for (const buildUrl of DECKLOG_URLS) {
    const url = buildUrl(deckCode);
    try {
      browser = await puppeteer.launch({
        headless: true, // ‘new’ 在某些版本會出錯，true 較通用
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1366,768",
          "--single-process", // 在 Docker/Railway 等低資源環境建議加上
        ],
      });

      const page = await browser.newPage();
      await applyStealth(page);

      console.log("📄 嘗試開啟 decklog 頁面:", url);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      await clickConsentIfAny(page);
      await sleep(800);
      await autoScroll(page);
      await sleep(600);

      // 先用 selector 精準取
      const sel = await tryReadDeck(page);
      const totalSel = sel.oshi.length + sel.deck.length + sel.energy.length;

      if (totalSel > 0) {
        console.log("🔎 抓取結果(selector)：", {
          viaHeading: true,
          counts: { oshi: sel.oshi.length, deck: sel.deck.length, energy: sel.energy.length }
        });
        await browser.close();
        return {
          oshi: sel.oshi,
          deck: sel.deck,
          energy: sel.energy,
          _viaHeading: true
        };
      }

      // 退而求其次：loose（無法分區；全部塞 deck）
      const loose = await extractLooseByHTML(page);
      console.log("🔎 抓取結果(loose)：", { viaHeading: false, total: loose.total });

      await browser.close();

      if (loose.total > 0) {
        return {
          oshi: [],
          deck: loose.deck,
          energy: [],
          _loose: true
        };
      }

      console.warn("⚠️ 此頁面不是 HoloTCG decklog 格式，或版面改動，跳過：", url);
      continue;

    } catch (error) {
      console.warn(`❌ 嘗試 ${url} 失敗：`, error.message);
      if (browser) { try { await browser.close(); } catch {} }
      browser = null;
    }
  }

  throw new Error("❌ 無法從任何 decklog 頁面讀取 HoloTCG 資料");
}

module.exports = { fetchDecklogData };
