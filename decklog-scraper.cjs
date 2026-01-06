// decklog-scraper.cjs
const puppeteer = require("puppeteer");

const DECKLOG_URLS = [
  (code) => `https://decklog-en.bushiroad.com/ja/view/${code}`, // 國際版（多半有 HoloTCG）
  (code) => `https://decklog.bushiroad.com/view/${code}`,        // 日本版備援
];

async function fetchDecklogData(deckCode) {
  let browser;

  for (const buildUrl of DECKLOG_URLS) {
    const url = buildUrl(deckCode);
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });

      const page = await browser.newPage();
      console.log("📄 嘗試開啟 decklog 頁面:", url);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

      // 等候任何可能的卡片影像載入（data-src 或 src 皆可）
      await page.waitForFunction(
        () =>
          !!document.querySelector('img[data-src*="cardlist/"], img[src*="cardlist/"]') ||
          !!document.querySelector(".card-controller-inner .num"),
        { timeout: 12000 }
      ).catch(() => null);

      const result = await page.evaluate(() => {
        // 標準化文字（移除空白/換行/全形引號等）
        const norm = (t = "") =>
          t.replace(/\s+/g, "").replace(/[“”"']/g, "").trim();

        // 找「最接近/最近的卡片容器」
        const findCardsNear = (titleEl) => {
          if (!titleEl) return [];
          // 往下找：標題元素下一個兄弟裡的卡片
          let root = titleEl.nextElementSibling;
          // 若下一個兄弟沒有卡片，往下多找幾層或往上找父層附近
          const candidates = [];
          if (root) candidates.push(root);
          if (titleEl.parentElement) candidates.push(titleEl.parentElement);
          if (titleEl.parentElement?.nextElementSibling)
            candidates.push(titleEl.parentElement.nextElementSibling);

          for (const c of candidates) {
            const imgs = c?.querySelectorAll?.('img.card-view-item, img[data-src*="cardlist/"], img[src*="cardlist/"]');
            if (imgs && imgs.length) return Array.from(imgs);
          }
          // 全域備援（最後手段）：抓整頁的卡片，再用區塊相對位置切分
          return Array.from(document.querySelectorAll('img.card-view-item, img[data-src*="cardlist/"], img[src*="cardlist/"]'));
        };

        // 支援多種標題寫法
        const TITLE_VARIANTS = {
          oshi: ["推しホロメン", "OshiHoloMember", "OshiHoloMen", "OshiMember", "Oshi"],
          main: ["メインデッキ", "MainDeck", "Main"],
          energy: ["エールデッキ", "YellDeck", "Yell", "エールDeck"],
        };

        // 收集所有可能標題元素（h2/h3 及常見的標題樣式）
        const headingEls = Array.from(document.querySelectorAll("h2, h3, .section-title, .title, [class*='title']"));
        const getHeading = (keys) =>
          headingEls.find((el) => keys.some((k) => norm(el.textContent).includes(norm(k))));

        const hOshi = getHeading(TITLE_VARIANTS.oshi);
        const hMain = getHeading(TITLE_VARIANTS.main);
        const hEnergy = getHeading(TITLE_VARIANTS.energy);

        const parseListFromHeading = (headingEl) => {
          const imgs = findCardsNear(headingEl);
          const list = [];
          imgs.forEach((img) => {
            const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
            if (!/cardlist\/.+\.png/.test(src)) return;

            const filename = src.split("/").pop().replace(/\.png.*/i, ""); // e.g. "hBP02-084_02_U"
            const m = filename.match(/^(h[A-Za-z]+\d*-\d{3})(.*)$/);
            if (!m) return;
            const id = m[1];                  // hBP02-084
            const version = m[2] || "_C";     // _02_U / _U / _C...

            // 數量：同卡片周圍的 .num
            const numEl =
              img.closest(".card-container")?.querySelector(".card-controller-inner .num") ||
              img.closest(".card")?.querySelector(".num") ||
              null;
            const count = numEl ? parseInt(numEl.textContent.trim(), 10) : 1;

            // 只收 HoloTCG 的 id 格式
            if (id) list.push({ id, count, version });
          });
          return list;
        };

        const oshi = parseListFromHeading(hOshi);
        const deck = parseListFromHeading(hMain);
        const energy = parseListFromHeading(hEnergy);

        return { oshi, deck, energy, _debug: {
          foundHeadings: {
            oshi: !!hOshi,
            main: !!hMain,
            energy: !!hEnergy,
          },
          counts: {
            oshi: oshi.length,
            deck: deck.length,
            energy: energy.length,
          }
        }};
      });

      await browser.close();

      // 除錯輸出
      console.log("🔎 抓取結果：", result?._debug);
      const ok =
        (result.oshi && result.oshi.length) ||
        (result.deck && result.deck.length) ||
        (result.energy && result.energy.length);

      if (!ok) {
        console.warn("⚠️ 此頁面不是 HoloTCG decklog 格式，或版面改動，跳過：", url);
        continue;
      }

      // 回傳標準格式
      return {
        oshi: result.oshi,
        deck: result.deck,
        energy: result.energy,
      };
    } catch (error) {
      console.warn(`❌ 嘗試 ${url} 失敗：`, error.message);
      if (browser) await browser.close();
      browser = null;
    }
  }

  throw new Error("❌ 無法從任何 decklog 頁面讀取 HoloTCG 資料");
}

module.exports = { fetchDecklogData };
