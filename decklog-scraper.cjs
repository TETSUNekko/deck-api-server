// decklog-scraper.cjs
const puppeteer = require("puppeteer");

const DECKLOG_URLS = [
  (code) => `https://decklog-en.bushiroad.com/ja/view/${code}`,
  (code) => `https://decklog.bushiroad.com/view/${code}`,
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
          "--disable-gpu",
          "--no-zygote",
        ],
      });

      const page = await browser.newPage();
      console.log("📄 嘗試開啟 decklog 頁面:", url);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      // 觸發 lazy-load：緩慢滾到頁底
      await autoScroll(page);

      // 第一階段：用標題定位（h2/h3/各式 title class）
      const viaHeading = await page.evaluate(() => {
        const norm = (t = "") =>
          t.replace(/\s+/g, "").replace(/[“”"']/g, "").trim();

        const TITLE_VARIANTS = {
          oshi: ["推しホロメン", "OshiHoloMember", "Oshi", "OshiMember"],
          main: ["メインデッキ", "MainDeck", "Main"],
          energy: ["エールデッキ", "YellDeck", "Yell", "エールDeck"],
        };

        const headings = Array.from(
          document.querySelectorAll("h1,h2,h3,.section-title,.title,[class*='title']")
        );

        const findHeading = (keys) =>
          headings.find((el) =>
            keys.some((k) => norm(el.textContent).includes(norm(k)))
          );

        const getCardsNear = (titleEl) => {
          if (!titleEl) return [];
          const candidates = new Set();

          // 直接下一個兄弟
          if (titleEl.nextElementSibling) candidates.add(titleEl.nextElementSibling);
          // 往父節點、父節點兄弟找
          if (titleEl.parentElement) candidates.add(titleEl.parentElement);
          if (titleEl.parentElement?.nextElementSibling)
            candidates.add(titleEl.parentElement.nextElementSibling);

          // 找卡片 img
          for (const c of candidates) {
            const imgs =
              c?.querySelectorAll?.(
                'img.card-view-item, img[data-src*="cardlist/"], img[src*="cardlist/"]'
              ) || [];
            if (imgs.length) return Array.from(imgs);
          }
          return [];
        };

        const pick = (imgEls) => {
          const cards = [];
          imgEls.forEach((img) => {
            const src =
              img.getAttribute("data-src") || img.getAttribute("src") || "";
            if (!/cardlist\/.+\.png/i.test(src)) return;
            const filename = src.split("/").pop().replace(/\.png.*/i, "");
            const m = filename.match(/^(h[A-Za-z]+\d*-\d{3})(.*)$/);
            if (!m) return;
            const id = m[1];
            const version = m[2] || "_C";
            // 取數量
            const numEl =
              img.closest(".card-container")?.querySelector(".card-controller-inner .num") ||
              img.closest(".card")?.querySelector(".num") ||
              null;
            const count = numEl ? parseInt(numEl.textContent.trim(), 10) : 1;
            cards.push({ id, version, count });
          });
          return cards;
        };

        const hOshi = findHeading(TITLE_VARIANTS.oshi);
        const hMain = findHeading(TITLE_VARIANTS.main);
        const hEnergy = findHeading(TITLE_VARIANTS.energy);

        const oshi = pick(getCardsNear(hOshi));
        const deck = pick(getCardsNear(hMain));
        const energy = pick(getCardsNear(hEnergy));

        return {
          oshi,
          deck,
          energy,
          _debug: {
            viaHeading: true,
            found: { oshi: !!hOshi, main: !!hMain, energy: !!hEnergy },
            counts: { oshi: oshi.length, deck: deck.length, energy: energy.length },
          },
        };
      });

      if (
        viaHeading &&
        (viaHeading.oshi.length || viaHeading.deck.length || viaHeading.energy.length)
      ) {
        console.log("🔎 抓取結果(heading)：", viaHeading._debug);
        await browser.close();
        return { oshi: viaHeading.oshi, deck: viaHeading.deck, energy: viaHeading.energy };
      }

      // 第二階段：寬鬆全頁抓取（不靠標題）
      const viaLoose = await page.evaluate(() => {
        const pick = () => {
          const imgs = Array.from(
            document.querySelectorAll(
              'img.card-view-item, img[data-src*="cardlist/"], img[src*="cardlist/"]'
            )
          );
          const cards = [];
          imgs.forEach((img) => {
            const src =
              img.getAttribute("data-src") || img.getAttribute("src") || "";
            if (!/cardlist\/.+\.png/i.test(src)) return;
            const filename = src.split("/").pop().replace(/\.png.*/i, "");
            const m = filename.match(/^(h[A-Za-z]+\d*-\d{3})(.*)$/);
            if (!m) return;
            const id = m[1];
            const version = m[2] || "_C";
            const numEl =
              img.closest(".card-container")?.querySelector(".card-controller-inner .num") ||
              img.closest(".card")?.querySelector(".num") ||
              null;
            const count = numEl ? parseInt(numEl.textContent.trim(), 10) : 1;
            cards.push({ id, version, count });
          });
          return cards;
        };

        const all = pick();
        return {
          all,
          _debug: { viaHeading: false, total: all.length },
        };
      });

      console.log("🔎 抓取結果(loose)：", viaLoose?._debug);

      await browser.close();

      if (viaLoose && viaLoose.all && viaLoose.all.length) {
        // 沒辦法分段就先全部塞 main，至少不中斷你的流程
        return { oshi: [], deck: viaLoose.all, energy: [] };
      }

      console.warn("⚠️ 此頁面不是 HoloTCG decklog 格式，或版面改動，跳過：", url);
    } catch (e) {
      console.warn(`❌ 嘗試 ${url} 失敗：`, e.message);
      if (browser) await browser.close();
      browser = null;
    }
  }

  throw new Error("❌ 無法從任何 decklog 頁面讀取 HoloTCG 資料");
}

// 平滑滾動到底（觸發 lazy-load）
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight + 1000) {
          clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  });
}

module.exports = { fetchDecklogData };
