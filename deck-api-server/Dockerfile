# 使用 Puppeteer 官方映像作為基礎
FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

# 安裝 canvas 系統依賴
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

# 安裝 Chrome 到 root，然後複製到 pptruser
RUN npx puppeteer browsers install chrome && \
    mkdir -p /home/pptruser/.cache && \
    cp -r /root/.cache/puppeteer /home/pptruser/.cache/puppeteer && \
    chown -R pptruser:pptruser /home/pptruser/.cache

# 複製專案檔案
COPY . .

RUN touch deckCodes.json && chmod 666 deckCodes.json

# 切換回 pptruser
USER pptruser

EXPOSE 3001

CMD ["node", "server.js"]