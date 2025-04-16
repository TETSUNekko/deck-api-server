# 使用 Puppeteer 官方映像作為基礎
FROM ghcr.io/puppeteer/puppeteer:latest

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 🔧 修正權限，避免 EACCES 錯誤
USER root
RUN chown -R pptruser:pptruser /app

# 🔽 切換回 puppeteer 的使用者
USER pptruser

# 安裝依賴
RUN npm install

# 複製剩下的專案檔案
COPY . .

# 開放埠
EXPOSE 3001

# 啟動指令
CMD ["node", "server.js"]
