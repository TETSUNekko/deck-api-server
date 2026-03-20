#!/bin/bash
set -e

echo "📦 [1/3] Push 後端到 GitHub（Railway 自動部署）"
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "⚠️ Nothing to commit"
git push origin main

echo "🛠️ [2/3] 建立前端 dist"
npm run --prefix client build

echo "📤 [3/3] 部署前端到 GitHub Pages"
npm run --prefix client deploy

echo "✅ 完成！"
echo "🌐 前端：https://tetsunekko.github.io/holotcgtw"
echo "⚙️ 後端：https://deck-api-server-production.up.railway.app"