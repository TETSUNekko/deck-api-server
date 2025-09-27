// server/export.js
import express from "express";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const router = express.Router();

// 匯出 API
router.post("/export-deck", async (req, res) => {
  try {
    const { oshi, deck, energy } = req.body;

    // 把所有卡片整合
    const allCards = [
      ...oshi.map(c => ({ ...c, group: "oshi" })),
      ...deck.map(c => ({ ...c, group: "deck" })),
      ...energy.map(c => ({ ...c, group: "energy" }))
    ];

    // 每張卡的路徑（根據 public/cards 目錄）
    const cardImages = allCards.map(c => {
      const file = path.join(process.cwd(), "public/cards", c.folder, `${c.id}${c.version}.png`);
      return { ...c, file };
    });

    // ⚡ 拼接圖片 (簡化：單行排列)
    const cardBuffers = await Promise.all(
      cardImages.map(async (c) => {
        if (!fs.existsSync(c.file)) {
          console.warn("缺少圖片:", c.file);
          return sharp({
            create: {
              width: 200,
              height: 280,
              channels: 3,
              background: { r: 220, g: 220, b: 220 }
            }
          }).png().toBuffer();
        }
        return sharp(c.file).resize(200, 280).toBuffer();
      })
    );

    const composite = cardBuffers.map((buf, i) => ({
      input: buf,
      left: (i % 10) * 200,  // 每行 10 張卡
      top: Math.floor(i / 10) * 280
    }));

    const totalWidth = 200 * 10;
    const totalHeight = 280 * Math.ceil(cardBuffers.length / 10);

    const finalImage = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).composite(composite).png().toBuffer();

    res.set("Content-Type", "image/png");
    res.send(finalImage);
  } catch (err) {
    console.error("❌ 匯出失敗:", err);
    res.status(500).json({ error: "匯出失敗" });
  }
});

export default router;
