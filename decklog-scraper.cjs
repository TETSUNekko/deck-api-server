// decklog-scraper.cjs (CommonJS ONLY)
const puppeteer = require("puppeteer");

const DECKLOG_URLS = [
  (code) => `https://decklog-en.bushiroad.com/ja/view/${code}`, // 國際版優先
  (code) => `https://decklog.bushiroad.com/view/${code}`,       // 備用：日本版
];

async function fetchDecklogData(deckCode) {
  for (const buildUrl of DECKLOG_URLS) {
    const url = buildUrl(deckCode);
    let browser = null;

    try {
      // ✅ Railway/容器環境比較常用的 launch 參數
      // 目的：減少 sandbox/fork/zygote 問題、避開 /dev/shm 太小
      browser = await puppeteer.launch({
        headless: "new",
        // ✅ 這行可明確指定「puppeteer 自己的 chromium」
        // （如果你的環境有下載到 bundled chrome）
        executablePath: puppeteer.executablePath?.() || undefined,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);
      page.setDefaultTimeout(30000);

      console.log("📄 嘗試開啟 decklog 頁面:", url);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      const result = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll("h3"));

        const parseCardsFromSection = (sectionTitles) => {
          const h3 = sections.find((el) =>
            sectionTitles.some((title) => el.textContent.includes(title))
          );
          if (!h3) return [];

          const cardDivs =
            h3.nextElementSibling?.querySelectorAll(".card-view-item") || [];

          const cards = [];

          cardDivs.forEach((img) => {
            const src = img.getAttribute("data-src") || img.getAttribute("src");
            const filename = src ? src.split("/").pop().replace(".png", "") : "";

            // filename 例：hBP02-084_02_U
            const idMatch = filename.match(/^(h[A-Za-z]+\d*-\d{3})/);
            const id = idMatch ? idMatch[1] : null;

            // version 例：_02_U（含底線）
            const version = id ? filename.slice(id.length) : "_C";

            const countEl = img
              .closest(".card-container")
              ?.querySelector(".card-controller-inner .num");

            if (id && countEl) {
              const count = parseInt(countEl.textContent.trim(), 10);
              cards.push({ id, count, version: version || "_C" });
            }
          });

          return cards;
        };

        return {
          oshi: parseCardsFromSection(["推しホロメン"]),
          deck: parseCardsFromSection(["メインデッキ", "Main Deck"]),
          energy: parseCardsFromSection(["エールデッキ", "“エール” Deck", '"エール" Deck']),
        };
      });

      // ✅ 只要三區都空，視為不是 HoloTCG decklog 格式 → 讓下一個 URL 試試看
      const empty =
        (!result.oshi || result.oshi.length === 0) &&
        (!result.deck || result.deck.length === 0) &&
        (!result.energy || result.energy.length === 0);

      if (empty) {
        console.warn("⚠️ 此頁面不是 HoloTCG decklog 格式，跳過：", url);
        continue;
      }

      return result;
    } catch (error) {
      console.warn(`❌ 嘗試 ${url} 失敗：`, error?.message || error);
    } finally {
      // ✅ 保證關閉 browser
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }
  }

  throw new Error("❌ 無法從任何 decklog 頁面讀取 HoloTCG 資料");
}

module.exports = { fetchDecklogData };
