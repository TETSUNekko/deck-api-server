# 使用 Node.js 官方映像（支援 node-canvas 編譯）
FROM node:18-bullseye

# 安裝 Puppeteer 與 node-canvas 需要的系統依賴
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libxss1 \
  libgtk-3-0 \
  libxshmfence1 \
  libglu1 \
  fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# 建立工作目錄
WORKDIR /app

# 複製 package.json 與 package-lock.json
COPY package*.json ./

# 安裝相依（這裡確保 puppeteer 與 canvas 都會裝好）
RUN npm install

# 複製程式碼與 cards 資料夾
COPY . .

# 環境變數：告訴 Puppeteer 路徑
ENV PUPPETEER_SKIP_DOWNLOAD=false \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 開放 port
EXPOSE 3001

# 啟動伺服器
CMD ["node", "server.js"]
