# HoloTCG Online 維護備忘錄

## 官方卡圖自動同步工具（2026-07-03 新增）

專案根目錄有兩支配套腳本，取代過去手動從官網一張張下載比對的流程：

### sync-cards.cjs — 比對並下載缺圖
```bash
node sync-cards.cjs             # dry-run：列出官方有、本地缺的卡圖
node sync-cards.cjs --download  # 下載 PNG 到 new_cards/（已 gitignore）並自動轉 webp 放進 webpcards/
```
- 資料來源：官方 decklog API `POST https://decklog.bushiroad.com/system/app/api/search/9`（免登入，需帶 Referer header），每頁 30 張分頁抓完
- 圖片 CDN：`https://hololive-official-cardgame.com/wp-content/images/cardlist/{資料夾}/{檔名}.png`
- 比對方式：**只比對檔名**（官方與本地資料夾名不一致，同卡可能在多個資料夾）
- 資料夾對應：官方 `hWF01`＝本地 `Twin_Wafer`、官方 `hCO01`＝本地 `2025Live_Set`（寫在腳本的 `FOLDER_ALIAS`）
- 轉檔依賴 ImageMagick（路徑寫在腳本開頭的 `MAGICK`）
- `sele` 開頭的教學卡會自動跳過

### update-versions.cjs — 補 JSON 資料
```bash
node update-versions.cjs
```
- 掃描 webpcards 全部圖檔，把 JSON `versions` 缺少的版本自動併入（依 VERSION_ORDER 排序）
- 圖片所在資料夾若沒有對應 entry，**自動從其他彈數複製最豐富的一筆**（name/tags/effectType 都會帶過來）當 reprint entry
- 找不到任何基礎資料的卡會列出來，需手動建立
- 資料夾 → JSON 檔的對應寫在腳本的 `FOLDER_JSON`，**新增彈數時記得補這張表**

### 新彈 / 新卡圖標準流程
```bash
node sync-cards.cjs --download   # 抓缺圖
node update-versions.cjs         # 補 JSON versions / reprint entry
cd client && npm run build:index # 重建圖片索引
npm run build                    # 打包
# 然後照常 deploy（cd client/dist → git add/commit/push origin gh-pages）
```
若出現全新資料夾（如 hCS01），另需：
1. `update-versions.cjs` 的 `FOLDER_JSON` 加對應（會自動建新 JSON 檔）
2. `cardsConfig.jsx` import 新 JSON 並加進 `cardSets`
3. `SearchBar.jsx` 的 `SERIES_LIST` 加一筆

### 官方資料庫已知錯誤（sync-cards.cjs 內建黑名單）
- `hBP05/hBP02-085_HR.png`（2026-07-03 發現）：官方 decklog 的重複記錄，卡號掛 hBP02-085（HOLOLIVE FANTASY），
  圖片實際是 **hBP02-065 ネリッサ・レイヴンクロフト 的 HR 卡**（卡面右下角編號可證）。
  官方 API 中 hBP02-085 只有 U/S/P 版本，沒有 HR。
  誤下載會讓 ネリッサ 的圖繼承 HOLOLIVE FANTASY 的 LIMITED tag，出現在錯誤的篩選結果。
  已加入 sync-cards.cjs 的 `BLACKLIST`，若官方之後修正可移除。

### 生日卡（hBD）注意事項
生日卡**不在 decklog API 裡**（非構築合法卡），sync-cards.cjs 抓不到。
要用 `fetch-hbd24.cjs`：從官方卡表網站搜尋頁爬取
（`hololive-official-cardgame.com/cardlist/cardsearch/?keyword=hBD24&...&view=text`，有分頁），
自動下載圖檔＋建 JSON entry（color/譯名從同名主推卡複製）。
hBD25 出了之後把腳本裡的系列代號改掉重跑即可。
生日卡是全年陸續發售的，建議每隔幾個月跑一次確認有沒有新卡。

### API 額外用途
搜尋參數支援效果文字比對（`keyword_type: ["text"]`），可用來稽核資料缺漏，
例如搜「LIMITED」可以拿到官方完整限制卡清單，跟我們 JSON 的 tags 比對。
（2026-07-02 就是靠這個發現 6 張卡全部檔案都缺 LIMITED tag）

---

## 2025-05-22 修復紀錄

### 修改內容

| 檔案 | 修改 |
|---|---|
| `client/src/cardList_hBP06.json` | hBP06-059 的 `versions` `_S.png` → `_SR.png`（版本名稱錯誤，實際圖檔為 `_SR`） |
| `client/src/cardList_hSD11.json` | hSD11-003 的 `versions` `_C.png` → `_C_re.png`（圖檔命名更新為 re 版） |
| `client/src/cardList_hSD11.json` | hSD11-004 的 `versions` `_U.png` → `_U_re.png`（同上） |
| `client/src/cardList_hSD14.json` | hSD14-010 的 `imageFolder` `hSD01/` → `hSD14/`（指向錯誤資料夾） |
| `client/src/cardList_PR.json` | hPR-002 的 `versions` 移除空的 `".png"` 條目 |
| `client/src/assets/imageIndex.json` | 執行 `npm run build:index` 重建，納入 2025Live_Set 的 8 張牌 |

### 2025Live_Set 問題原因
圖檔已放進 `client/public/webpcards/2025Live_Set/`，但 `imageIndex.json` 是自動產生的，需要手動執行 `npm run build:index` 才會更新。新增圖檔後記得重建。

---

## 系統架構說明

### imageIndex.json 的產生方式
- **腳本**：`client/scripts/build-image-index.cjs`
- **觸發時機**：`npm run dev` 和 `npm run build` 執行前會自動跑（`predev`/`prebuild`）
- **手動執行**：`cd client && npm run build:index`
- **掃描對象**：`client/public/webpcards/` 下所有非 `-trans` 資料夾的 `.webp`/`.png` 檔案
- **輸出**：`client/src/assets/imageIndex.json`（`byKey` + `versionsById`）

### 圖片命名規則
```
{卡片ID}{版本尾碼}.webp
例：hBP01-001_C.webp、hSD11-003_C_re.webp、hPR-002_P.webp
```

**已知版本尾碼**（在 `build-image-index.cjs` 的 `VERSION_ORDER` 定義排序）：
`_C`, `_C_2`, `_C_02`, `_U`, `_U_2`, `_U_02`, `_S`, `_S_02`, `_P`, `_P_1`, `_P_2`, `_P_3`, `_P_02`, `_R`, `_R_02`, `_RR`, `_RR_02`, `_SR`, `_UR`, `_HR`, `_SEC`

沒有尾碼的檔案（如 `hPR-002.webp`）會被視為 `_C` 版本。

### cardList JSON 的 `versions` 欄位
- 每個字串對應一個版本尾碼，格式為 `_XX.png`（帶副檔名）
- **不影響 UI 顯示**：實際顯示的版本由 `imageIndex.json` 的 `byKey` 決定，JSON 的 `versions` 僅作為 metadata 參考
- 因此 `versions` 填錯不會讓牌消失，但會造成 metadata 不一致

### 跨 Set 的復刻牌
卡片 ID 和 `imageFolder` 不同是**正常設計**，代表這張牌以不同圖在另一個 set 出現。例如：
- `hBP01-104` 在 `hSD11.json` 中 `imageFolder: hSD11/` → 使用 hSD11 資料夾內的圖

---

## 新增卡片 SOP（手動流程，一般情況請優先用上方的自動同步工具）

### 1. 新增卡組
1. 在 `client/public/webpcards/{setName}/` 放入 `.webp` 圖檔
2. 在 `client/src/` 新增 `cardList_{setName}.json`，格式參考既有檔案
3. 在 `client/src/components/cardsConfig.jsx` import 新的 JSON，並加進 `cardSets` 陣列
4. **在 `client/src/components/SearchBar.jsx` 的 `SERIES_LIST` 加一筆**（否則彈數篩選器選不到這個新套組）
5. 執行 `cd client && npm run build:index` 重建索引

### 2. 新增已有卡組的新圖（復刻/新版本）
1. 把圖檔放進對應資料夾，命名格式：`{ID}_{版本}.webp`
2. 在對應 `cardList_*.json` 的 `versions` 陣列加入新版本
3. 執行 `npm run build:index`

---

## 定期健康檢查腳本

在專案根目錄執行以下指令可快速驗證系統狀態：

```bash
node -e "
const fs = require('fs');
const path = require('path');
const idx = JSON.parse(fs.readFileSync('client/src/assets/imageIndex.json', 'utf8'));
const byKey = idx.byKey || {};
const srcDir = 'client/src';
const webpDir = 'client/public/webpcards';

// 1. 找孤兒圖片（在磁碟上但不在 imageIndex）
const folders = fs.readdirSync(webpDir).filter(f =>
  fs.statSync(path.join(webpDir, f)).isDirectory() && !f.endsWith('-trans')
);
let orphans = [];
for (const folder of folders) {
  for (const file of fs.readdirSync(path.join(webpDir, folder)).filter(f => f.endsWith('.webp'))) {
    const rel = folder + '/' + file;
    if (!Object.values(byKey).includes(rel)) orphans.push(rel);
  }
}
console.log('孤兒圖片（有圖無索引）:', orphans.length);
orphans.forEach(f => console.log(' ', f));

// 2. 找索引中版本錯誤的卡（JSON versions 指向不存在的 key）
const jsonFiles = fs.readdirSync(srcDir).filter(f => f.startsWith('cardList_') && f.endsWith('.json'));
let broken = [];
for (const jf of jsonFiles) {
  for (const card of JSON.parse(fs.readFileSync(path.join(srcDir, jf), 'utf8'))) {
    const folder = (card.imageFolder || '').replace(/\/\$/, '');
    for (const v of (card.versions || [])) {
      const s = v.replace(/\.(png|webp)\$/, '');
      if (!s) continue;
      const key = card.id + s + '@' + folder;
      if (!byKey[key]) broken.push(card.id + ' ' + v + ' (' + jf + ')');
    }
  }
}
console.log('版本錯誤（JSON versions 找不到對應圖）:', broken.length);
broken.forEach(b => console.log(' ', b));
"
```

正常狀態：兩個數字都應為 **0**。
