const puppeteer = require("puppeteer");

const DECK_CODE = "4BTEY"; // ← 你可以改成其他 decklog 代碼
const DECK_URL = `https://decklog.bushiroad.com/view/${DECK_CODE}`;

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(DECK_URL, { waitUntil: "networkidle2" });

  const result = await page.evaluate(() => {
    // 所有卡片區塊
    const sections = Array.from(document.querySelectorAll("h3"));

    const parseCardsFromSection = (sectionTitle) => {
      const h3 = sections.find((el) => el.textContent.includes(sectionTitle));
      if (!h3) return [];

      const cardDivs = h3.nextElementSibling?.querySelectorAll(".card-view-item") || [];
      const cards = [];

      cardDivs.forEach((img) => {
        const title = img.getAttribute("title"); // 例如：hBP01-014 : 天音かなた
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
      main: parseCardsFromSection("メインデッキ"),
      energy: parseCardsFromSection("エールデッキ"),
    };
  });

  console.log("✅ 抓取成功！");
  console.log("主推卡：", result.oshi);
  console.log("主卡組：", result.main);
  console.log("能量卡：", result.energy);

  await browser.close();
})();
