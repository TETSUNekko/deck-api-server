const puppeteer = require("puppeteer");

const DECKLOG_URLS = [
  (code) => `https://decklog-en.bushiroad.com/ja/view/${code}`, // ✅ 國際版優先（通常是 HoloTCG）
  (code) => `https://decklog.bushiroad.com/view/${code}`,        // 備用：日本版
];

async function fetchDecklogData(deckCode) {
  let browser;

  for (const buildUrl of DECKLOG_URLS) {
    const url = buildUrl(deckCode);
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      console.log("📄 嘗試開啟 decklog 頁面:", url);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

      const result = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll("h3"));
        const parseCardsFromSection = (title) => {
          const h3 = sections.find((el) => el.textContent.includes(title));
          if (!h3) return [];
          const cardDivs = h3.nextElementSibling?.querySelectorAll(".card-view-item") || [];
          const cards = [];
          cardDivs.forEach((img) => {
            const title = img.getAttribute("title");
            const countEl = img.closest(".card-container")?.querySelector(".card-controller-inner .num");
            if (title && countEl) {
              const [id] = title.split(" : ");
              const count = parseInt(countEl.textContent.trim(), 10);
              cards.push({ id, count });
            }
          });
          return cards;
        };

        const oshi = parseCardsFromSection("推しホロメン");
        const deck = parseCardsFromSection("メインデッキ");
        const energy = parseCardsFromSection("エールデッキ");

        return { oshi, deck, energy };
      });

      await browser.close();

      // ✅ 如果三個欄位都是空的，代表不是 HoloTCG 的 decklog，應該視為失敗
      if (
        (!result.oshi || result.oshi.length === 0) &&
        (!result.deck || result.deck.length === 0) &&
        (!result.energy || result.energy.length === 0)
      ) {
        console.warn("⚠️ 此頁面不是 HoloTCG decklog 格式，跳過：", url);
        continue;
      }

      return result; // ✅ 成功取得 HoloTCG 格式資料
    } catch (error) {
      console.warn(`❌ 嘗試 ${url} 失敗：`, error.message);
      if (browser) await browser.close();
      browser = null;
    }
  }

  throw new Error("❌ 無法從任何 decklog 頁面讀取 HoloTCG 資料");
}

module.exports = { fetchDecklogData };
