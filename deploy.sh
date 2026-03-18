#!/bin/bash

# === HoloTCG GitHub Pages 一鍵部署腳本 ===

echo "🛠️ [1/5] 建立 dist"
npm run --prefix client build

echo "📂 [2/5] 進入 dist 資料夾"
cd client/dist

echo "🔧 [3/5] 初始化 git repo"
git init
git checkout -b gh-pages
git remote add origin https://github.com/TETSUNekko/holotcgtw.git

echo "📦 [4/5] 加入檔案並 Commit"
git add .
git commit -m "🚀 Deploy $(date '+%Y-%m-%d %H:%M:%S')"

echo "📤 [5/5] 推送 gh-pages（--force）"
git push -f origin gh-pages

echo "✅ 部署完成！請查看 👉 https://tetsunekko.github.io/holotcgtw"
