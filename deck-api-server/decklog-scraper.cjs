const puppeteer = require("puppeteer");

// ✅ 包成函式
async function fetchDecklogData(deckCode) {
  const DECK_URL = `https://decklog.bushiroad.com/view/${deckCode}`;
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(DECK_URL, { waitUntil: "networkidle2" });

  const result = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("h3"));

    const parseCardsFromSection = (sectionTitle) => {
      const h3 = sections.find((el) => el.textContent.includes(sectionTitle));
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

    return {
      oshi: parseCardsFromSection("推しホロメン"),
      deck: parseCardsFromSection("メインデッキ"),
      energy: parseCardsFromSection("エールデッキ"),
    };
  });

  await browser.close();
  return result;
}

// ✅ 正確匯出方式
module.exports = { fetchDecklogData };
