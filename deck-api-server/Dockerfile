# 使用 Puppeteer 官方映像作為基礎
FROM ghcr.io/puppeteer/puppeteer:latest

# 設定工作目錄
WORKDIR /app

# 安裝 canvas 所需的系統依賴
USER root
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製 package 檔案並安裝依賴
COPY package*.json ./
RUN npm install

# 安裝 Puppeteer 需要的 Chrome
RUN npx puppeteer browsers install chrome

# 複製剩下的專案檔案
COPY . .

# ✅ 建立並設定 deckCodes.json 權限
RUN touch deckCodes.json && chmod 666 deckCodes.json

# ✅ 切換回 puppeteer 預設使用者
USER pptruser

# 開放埠
EXPOSE 3001

# 啟動指令
CMD ["node", "server.js"]