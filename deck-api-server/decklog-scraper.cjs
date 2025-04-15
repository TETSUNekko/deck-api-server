const puppeteer = require("puppeteer");

async function fetchDecklogData(deckCode) {
  const DECK_URL = `https://decklog.bushiroad.com/view/${deckCode}`;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    });

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

    return result;
  } catch (error) {
    console.error("❌ Puppeteer 抓取失敗：", error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { fetchDecklogData };
