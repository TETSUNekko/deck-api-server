#!/bin/bash

# 停止遇到錯誤
set -e

# 預設 commit 訊息
msg="update: deploy server changes"

# 如果有輸入參數，覆蓋 commit 訊息
if [ $# -gt 0 ]; then
  msg="$*"
fi

echo "📦 Adding changes..."
git add .

echo "📝 Commit message: $msg"
git commit -m "$msg" || echo "⚠️ Nothing to commit"

echo "🚀 Pushing to origin main..."
git push origin main

echo "✅ Done. Railway will auto-deploy your deck-api-server."
