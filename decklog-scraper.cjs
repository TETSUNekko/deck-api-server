// decklog-scraper.cjs
const puppeteer = require("puppeteer");

// 兩個入口（先國際、再日本）
const DECKLOG_URLS = [
  (code) => `https://decklog-en.bushiroad.com/ja/view/${code}`,
  (code) => `https://decklog.bushiroad.com/view/${code}`,
];

// 常用 User-Agent（桌機版 Chrome）
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// 一些常見的 DOM selector（多路徑嘗試）
const SELECTORS = {
  // 區塊標題（舊版）
  h3: "h3",
  // 卡項節點（舊版）
  cardItem: ".card-view-item, .decklist img[title], .decklist .card > img",
  // 牌數字樣（靠近卡項）
  count: ".card-controller-inner .num, .num, .count, .card__num",
  // 同意按鈕（cookie banner 常見）
  consentButtons: [
    'button:has-text("同意")',
    'button:has-text("同意する")',
    'button:has-text("AGREE")',
    'button:has-text("Agree")',
    '[aria-label="Agree"]',
    '#onetrust-accept-btn-handler',
  ],
};

// 移除 webdriver 痕跡（降低被擋）
async function hardenAgainstBotDetection(page) {
  await page.evaluateOnNewDocument(() => {
    // 刪除 webdriver 標記
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // 偽造 plugins / languages
    Object.defineProperty(navigator, "languages", { get: () => ["ja", "en-US"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
  });
}

async function clickConsentIfAny(page) {
  try {
    // 粗暴：嘗試點幾種常見同意鈕
    await page.evaluate(() => {
      const texts = ["同意", "同意する", "AGREE", "Agree", "OK"];
      const btns = Array.from(document.querySelectorAll("button, [role='button'], .btn, .Button"));
      for (const b of btns) {
        const t = (b.innerText || b.textContent || "").trim();
        if (texts.some((w) => t.includes(w))) {
          b.click();
          return true;
        }
      }
      const oneTrust = document.getElementById("onetrust-accept-btn-handler");
      if (oneTrust) { oneTrust.click(); return true; }
      return false;
    });
    await page.waitForTimeout(800);
  } catch {}
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const distance = 600;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;
        if (total >= document.body.scrollHeight * 1.2) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
    });
  });
}

function normalizeVersion(filename, id) {
  // filename = hBP02-084_02_U  或  hSD01-016_OSR
  if (!filename || !id) return "_C";
  const v = filename.replace(id, ""); // 取出 "_02_U" 或 "_OSR"
  return v || "_C";
}

function filenameFromSrc(src) {
  try {
    return src.split("/").pop().replace(".png", "");
  } catch {
    return "";
  }
}

async function extractLooseByHTML(html) {
  // 極限 fallback：只看 HTML 裡的圖片 URL
  // e.g. .../cardlist/hBP02/hBP02-084_02_U.png
  const re = /([hH][A-Za-z]+\d*-\d{3})_([A-Za-z0-9_]+)\.png/g;
  const set = new Map(); // key: id+version -> count
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const ver = "_" + m[2];
    const k = id + ver;
    set.set(k, (set.get(k) || 0) + 1);
  }
  const list = Array.from(set.entries()).map(([k, c]) => {
    const id = k.match(/^([hH][A-Za-z]+\d*-\d{3})/)[1];
    const version = k.replace(id, "");
    return { id, version, count: c };
  });
  return {
    oshi: [],
    deck: list, // 無法區分區塊，只好全部丟 deck
    energy: [],
    _loose: true,
  };
}

async function tryReadDeck(page) {
  // 1) 先用穩健 selector 抓「卡項」
  const cards = await page.$$eval(SELECTORS.cardItem, (nodes) => {
    const out = [];
    nodes.forEach((n) => {
      // 圖片可能在自身或 data-src
      const img = n.tagName === "IMG" ? n : n.querySelector("img");
      if (!img) return;
      const title = img.getAttribute("title") || "";
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      const filename = src ? src.split("/").pop().replace(".png", "") : "";

      // id = hBP02-084
      const m = filename.match(/^([hH][A-Za-z]+\d*-\d{3})/);
      if (!m) return;
      const id = m[1];
      const version = filename.replace(id, "") || "_C";

      // 數量在附近
      let count = 1;
      const wrap = n.closest(".card-container") || n.closest(".card") || n.parentElement;
      if (wrap) {
        const numEl = wrap.querySelector(".card-controller-inner .num, .num, .count, .card__num");
        if (numEl) {
          const t = (numEl.textContent || "").trim();
          const v = parseInt(t, 10);
          if (!Number.isNaN(v) && v > 0) count = v;
        }
      }
      out.push({ id, version, count, _raw: { title, src } });
    });
    return out;
  });

  // 2) 嘗試依標題區塊分類（舊版/新版皆可能改版，因此保守）
  const headings = await page.$$eval(SELECTORS.h3, (hs) =>
    hs.map((h) => (h.textContent || "").trim())
  );
  const text = (s) => (s || "").toLowerCase();
  const findH = (keys) => headings.find((t) => keys.some((k) => text(t).includes(text(k))));

  const hasOshi = !!findH(["推し", "推しホロメン", "oshi"]);
  const hasMain = !!findH(["メインデッキ", "main deck", "メイン"]);
  const hasEnergy = !!findH(["エール", "“エール” deck", "yell", "energy"]);

  // 如果沒有任何標題命中，就直接回傳「整包 deck」
  if (!hasOshi && !hasMain && !hasEnergy) {
    return {
      oshi: [],
      deck: cards,
      energy: [],
      _viaHeading: false,
    };
  }

  // 有標題就盡力分流（簡化版：依相對位置或父層容器進行粗分，這裡先全部丟進 deck）
  return {
    oshi: [],
    deck: cards,
    energy: [],
    _viaHeading: true,
  };
}

async function fetchDecklogData(deckCode) {
  let browser;

  for (const buildUrl of DECKLOG_URLS) {
    const url = buildUrl(deckCode);
    try {
      browser = await puppeteer.launch({
        headless: "new",
        // Railway/Nixpacks often needs these:
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-features=site-per-process",
          "--disable-blink-features=AutomationControlled",
          "--no-zygote",
          "--single-process",
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent(UA);
      await page.setExtraHTTPHeaders({
        "Accept-Language": "ja,en;q=0.9",
        "Sec-CH-UA-Platform": "Windows",
      });
      await hardenAgainstBotDetection(page);

      console.log("📄 嘗試開啟 decklog 頁面:", url);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      // 先嘗試點 cookie 同意
      await clickConsentIfAny(page);

      // 滾動觸發 lazy-load
      await autoScroll(page);
      await page.waitForTimeout(1000);

      // 若看不到任何卡項，就再等 network idle 一次
      const hasAnyCard = await page.$(SELECTORS.cardItem);
      if (!hasAnyCard) {
        await page.waitForNetworkIdle({ idleTime: 800, timeout: 10000 }).catch(() => {});
      }

      // 主要嘗試：用 selector 抓
      const result = await tryReadDeck(page);

      // 如果 selector 還是抓不到，做 HTML regex fallback
      if ((result.deck?.length || 0) === 0) {
        const html = await page.content();
        const loose = await extractLooseByHTML(html);
        console.log("🔎 抓取結果(loose)：", {
          viaHeading: !!loose._viaHeading,
          total: (loose.deck?.length || 0) + (loose.oshi?.length || 0) + (loose.energy?.length || 0),
        });
        await browser.close();
        if (
          (loose.deck?.length || 0) +
            (loose.oshi?.length || 0) +
            (loose.energy?.length || 0) >
          0
        ) {
          return loose;
        }
      } else {
        console.log("🔎 抓取結果(selector)：", {
          viaHeading: !!result._viaHeading,
          total: (result.deck?.length || 0) + (result.oshi?.length || 0) + (result.energy?.length || 0),
        });
        await browser.close();
        return result;
      }

      // 走到這裡：此 URL 失敗 → 試下一個
      console.warn("⚠️ 此頁面不是 HoloTCG decklog 格式，或版面改動，跳過：", url);
    } catch (error) {
      console.warn(`❌ 嘗試 ${url} 失敗：`, error.message);
      if (browser) await browser.close();
      browser = null;
    }
  }

  throw new Error("❌ 無法從任何 decklog 頁面讀取 HoloTCG 資料");
}

module.exports = { fetchDecklogData };
