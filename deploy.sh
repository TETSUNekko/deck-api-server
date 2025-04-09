#!/bin/bash

# === 一鍵部署腳本 for HoloTCG ===
# 路徑：holotcg-online/deploy.sh

echo "🛠️ [1/5] 建立前端 client 的 dist..."
npm run --prefix client build

echo "📂 [2/5] 進入 client/dist 資料夾"
cd client/dist

echo "🔧 [3/5] 初始化 Git 並設定 gh-pages 分支"
git init
git remote add origin https://github.com/TETSUNekko/holotcgtw.git
git checkout -b gh-pages

echo "📦 [4/5] 加入檔案並 Commit"
git add .
git commit -m "🚀 部署更新：$(date '+%Y-%m-%d %H:%M:%S')"

echo "📡 [5/5] 推送到 GitHub gh-pages 分支（force）"
git push -f origin gh-pages

echo "✅ 完成！請查看 👉 https://tetsunekko.github.io/holotcgtw"
