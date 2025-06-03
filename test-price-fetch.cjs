const puppeteer = require("puppeteer");

async function fetchNewestCards() {
  const url = "https://yuyu-tei.jp/sell/hocg/s/hbp03#newest";

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // 等待主要卡片區塊出現（最多等 5 秒）
  await page.waitForSelector(".card_list_box", { timeout: 5000 });

  const cards = await page.evaluate(() => {
    const results = [];
    const rows = document.querySelectorAll(".card_list_box .row");

    rows.forEach(row => {
      const raritySpan = row.querySelector('span.fw-bold');
      const cardIdSpan = row.querySelector('span.text-center');
      const nameElem = row.querySelector('h4.text-primary');
      const priceElem = row.querySelector('strong.text-end');

      const rarity = raritySpan ? raritySpan.innerText.trim() : null;
      const cardId = cardIdSpan ? cardIdSpan.innerText.trim() : null;
      const name = nameElem ? nameElem.innerText.trim() : null;
      const price = priceElem ? priceElem.innerText.trim() : null;

      if (cardId && name && price) {
        results.push({ cardId, rarity, name, price });
      }
    });

    return results;
  });

  console.log(cards);
  await browser.close();
}

fetchNewestCards();
