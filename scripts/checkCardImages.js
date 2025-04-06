import fs from "fs";
import path from "path";

const cardList = JSON.parse(fs.readFileSync("./src/cardList_hBP01.json"));
const energyCardList = JSON.parse(fs.readFileSync("./src/cardList_hY.json"));

const allCards = [...cardList, ...energyCardList];
const publicPath = path.join(process.cwd(), "public", "cards");

const missing = [];

for (const card of allCards) {
  const folder = path.join(publicPath, card.imageFolder);
  const versions = card.versions || ["_C.png"];

  for (const version of versions) {
    const filename = `${card.id}${version}`;
    const filepath = path.join(folder, filename);
    if (!fs.existsSync(filepath)) {
      missing.push(path.join("cards", card.imageFolder, filename));
    }
  }
}

if (missing.length === 0) {
  console.log("✅ 所有卡圖都存在！");
} else {
  console.log(`❌ 有 ${missing.length} 張卡圖找不到：`);
  missing.forEach((f) => console.log(" -", f));
}
