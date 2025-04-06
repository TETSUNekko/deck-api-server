// generateCardlist.js
import fs from 'fs';
import path from 'path';

// 卡圖資料夾路徑
const imageDir = path.join(process.cwd(), 'client', 'public', 'cards', 'hBP01');
const outputJson = path.join(process.cwd(), 'client', 'src', 'cardList_hBP01.json');

// 避免重複卡片
const cardMap = new Map();

// 讀取資料夾
fs.readdir(imageDir, (err, files) => {
  if (err) {
    console.error('❌ 無法讀取卡圖資料夾：', err);
    return;
  }

  // 篩選所有 .png 檔案
  const imageFiles = files.filter(file => file.endsWith('.png'));

  imageFiles.forEach(file => {
    const match = file.match(/^(hBP\d{2}-\d{3})_[A-Z]+\.png$/);
    if (!match) return;

    const id = match[1];
    if (cardMap.has(id)) return; // 如果已經加入，就跳過

    const card = {
      id,
      name: id,
      type: parseInt(id.split('-')[1]) <= 8 ? '主推卡' : '一般卡',
      imageFolder: '/cards/hBP01/'
    };

    cardMap.set(id, card);
  });

  const cardList = Array.from(cardMap.values());
  fs.writeFileSync(outputJson, JSON.stringify(cardList, null, 2), 'utf-8');
  console.log(`✅ 已產生 ${cardList.length} 張卡片至 cardList_hBP01.json`);
});
