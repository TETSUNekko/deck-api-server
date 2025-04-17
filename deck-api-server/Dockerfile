# 使用 Puppeteer 官方映像作為基礎
FROM ghcr.io/puppeteer/puppeteer:latest

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案並安裝依賴
COPY package*.json ./
USER root
RUN npm install

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
