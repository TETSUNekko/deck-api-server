# 使用 Puppeteer 官方映像
FROM ghcr.io/puppeteer/puppeteer:latest

# 切換到 root 以安裝系統套件
USER root

# 1. 安裝 node-canvas 必要的系統依賴
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-noto \
    fonts-noto-cjk \
    fontconfig \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. 設定 Puppeteer 快取目錄（這會影響 npx 安裝的位置）
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

# 3. 先複製 package.json 並安裝 npm 套件
COPY package*.json ./
RUN npm install

# 4. 安裝 Chrome 瀏覽器
RUN npx puppeteer browsers install chrome

# 5. 複製其餘專案檔案 (包含你的 cards 資料夾)
COPY . .

# 6. 強制修正所有權限（包含剛剛 COPY 進來的 cards）
# 確保 pptruser 可以讀取圖片並執行 chrome
RUN chown -R pptruser:pptruser /app /home/pptruser/.cache

# 7. 建立空白 JSON (如果你的程式碼還在使用它)
RUN touch /app/deckCodes.json && chown pptruser:pptruser /app/deckCodes.json

# 切換回非 root 使用者執行
USER pptruser

# Railway 建議不要寫死 PORT，這裡保留 EXPOSE 即可
EXPOSE 3001

CMD ["node", "server.js"]