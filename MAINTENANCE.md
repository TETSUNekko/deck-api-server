# HoloTCG Online 維護備忘錄

## 官方卡圖自動同步工具（2026-07-03 新增，2026-08-18 補 fetch-set.cjs）

專案根目錄有數支配套腳本，取代過去手動從官網一張張下載比對的流程。
**新彈上線用 `fetch-set.cjs`，日常補漏用 `sync-cards.cjs`。**

### fetch-set.cjs — 新彈完整卡表（主力工具）
```bash
node fetch-set.cjs hEB01           # 預覽解析結果，不寫檔
node fetch-set.cjs hEB01 --write   # 產生 client/src/cardList_hEB01.json
```
從**官方卡表網站**爬整個商品的收錄清單，自動填卡名／顏色／HP／Bloom 等級／標籤／效果類型。

⚠️ **最重要的一個坑：必須用 `expansion_name` 不能用 `keyword`**
```
?expansion_name=hEB01     ← 正確：整個商品的收錄清單（含復刻卡）
?keyword=hEB01            ← 錯誤：只抓得到卡號開頭是 hEB01 的卡
```
新彈通常收錄大量**復刻卡**，它們的卡號是原本的（例如 `hBP01-021`），只是在新彈出了新圖
（`hEB01/hBP01-021_C_02.png`）。用 keyword 搜會整批漏掉。
2026-08-18 hEB01 第一次爬就踩到：只抓到 34 張自身卡，實際整彈 93 張。

腳本的其他行為：
- **復刻卡用「卡號」對既有資料**，不是比對卡名。因為官方與本站的漢字字形可能不同
  （官方 `兎田ぺこら` U+514E／本站 `兔田ぺこら` U+5154），比對名字會失敗。
  對到既有 entry 就沿用本站的 `name` 和 `searchKeywords`，字形與譯名自動保持一致。
- **沿用原彈卡圖的收錄卡，要把圖複製進本彈資料夾**。有些復刻卡官方沒出新圖，
  卡圖路徑仍指向原彈（例如 hEB01 收錄的 `hBP01-104` 圖是 `hBP01/hBP01-104_C.png`）。
  這種卡**還是要建 entry**，而且必須把 webp 複製一份到本彈資料夾，否則彈數篩選會漏掉它們
  —— 因為篩選是看「卡圖在哪個資料夾」(`card.folder === filterSeries`)，不是看 JSON。
  這也是本站既有慣例：`hBP01-104_C.webp` 同一個檔名複製在 10 個資料夾裡。
  腳本會列出要複製哪些檔案並附上一鍵複製指令。
  hEB01 有 9 張是這種（`hBP01-104/107/118`、`hBP02-079/095`、`hBP03-088`、
  `hBP04-105`、`hSD01-018`、`hSD06-011`），漏掉的話整彈會從 102 張變成 93 張。
- 標籤對應表 `TAG` 用的是**官方日文標籤原文**，容易猜錯，跑預覽會列出未對應的。
  已知易錯：`#トリ`→鳥、`#お酒`→酒、`#ベイビー`→嬰兒、`#シューター`→射手、`#こよラボ`→小夜璃實驗室
- 支援卡沒有前例可對時要手動補 `NAME_ZH` 表。**中文譯名直接讀 `webpcards/<彈>-trans/` 的翻譯圖**
  （鳳凰貓做的圖上就印著卡片中文名），不要自己猜。
- `hp` 會填官方實際數值（UI 沒用到，純 metadata，但有總比空白好）

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

⚠️ **decklog API 的兩個盲點**（所以新彈不能只靠 sync-cards.cjs）：
1. **完全不收主推卡**。拿任何主推卡卡號去查都是 0 筆（`hSD01-001` 也一樣）。
   試過 `card_kind`／`deck_type` 等參數都被忽略，也找不到另外的端點。
2. **沒有顏色／標籤欄位**，只有不透明的 `p_param`／`g_param`。

官方卡表網站兩者都有，所以 `fetch-set.cjs` 走網站爬蟲而非 API。

### update-versions.cjs — 補 JSON 資料
```bash
node update-versions.cjs
```
- 掃描 webpcards 全部圖檔，把 JSON `versions` 缺少的版本自動併入（依 VERSION_ORDER 排序）
- 圖片所在資料夾若沒有對應 entry，**自動從其他彈數複製最豐富的一筆**（name/tags/effectType 都會帶過來）當 reprint entry
- 找不到任何基礎資料的卡會列出來，需手動建立
- 資料夾 → JSON 檔的對應寫在腳本的 `FOLDER_JSON`，**新增彈數時記得補這張表**

### process-images.ps1 — 翻譯圖裁切
翻譯圖是 1920x1080，取右半 1120x1080 輸出 webp。
```powershell
.\process-images.ps1 -InputFolder "C:\...\hEB01" -AutoRoute -DryRun   # 先看分流對不對
.\process-images.ps1 -InputFolder "C:\...\hEB01" -AutoRoute           # 實際輸出
```
`-AutoRoute` 依檔名自動分流到對應的 `<彈數>-trans` 資料夾：
```
hEB01-hBP01-021.jpg → hEB01-trans\hBP01-021.webp   （復刻卡：前綴=所在彈數，其餘=卡號）
hEB01-001.jpg       → hEB01-trans\hEB01-001.webp   （自身卡）
hBP04-001.jpg       → hBP04-trans\hBP04-001.webp   （散裝檔案依卡號歸位）
```
復刻卡要用**原始卡號**當檔名，是為了配合 `ZoomModal.jsx` 的查找順序：
```js
primary  = `webpcards/${entry.folder}-trans/${entry.id}.webp`   // 卡圖所在彈數
fallback = `webpcards/${id前綴}-trans/${entry.id}.webp`          // 卡片原始彈數
```
這樣復刻卡會優先吃到新彈版本的翻譯，沒有才 fallback 回原彈的舊翻譯。

⚠️ **這支檔案必須存成 UTF-8 with BOM**。PowerShell 5.1 讀 .ps1 預設當 ANSI(cp950)，
沒 BOM 的話裡面的中文會亂碼，導致字串沒收尾、整個檔案語法錯誤。
用別的編輯器改完記得確認編碼。

### 新彈 / 新卡圖標準流程
```bash
# 1. 卡表資料（新彈用這支，含主推卡與復刻卡）
node fetch-set.cjs <彈數>            # 先預覽，確認沒有「未對應標籤」「缺譯名」警告
node fetch-set.cjs <彈數> --write

# 2. 卡圖：官方 PNG → webp（Q=92 是 ImageMagick 預設值，與既有圖一致）
#    直接 magick in.png out.webp 即可，不用加參數

# 3. 翻譯圖
.\process-images.ps1 -InputFolder "<翻譯圖資料夾>" -AutoRoute

# 4. 補其他資料夾的版本（例如 hPR 的促銷版）
node update-versions.cjs

# 5. 索引 + 打包
cd client && npm run build:index
npm run build
# 然後 deploy（cd client/dist → git add/commit/push origin gh-pages）
```
全新資料夾（如 hEB01、hCS01）另需三處掛載：
1. `update-versions.cjs` 的 `FOLDER_JSON` 加對應
2. `cardsConfig.jsx` import 新 JSON 並加進 `cardSets`（放前面＝卡片列表排前面）
3. `SearchBar.jsx` 的 `SERIES_LIST` 加一筆

新標籤還要加進 `cardsConfig.jsx` 的 `allTags`，否則標籤篩選選單看不到。

### cardList JSON 的排列順序（2026-08-18 補記）

**JSON 陣列的順序 = 卡片列表的顯示順序。** `DeckBuilder.jsx` 用 `cardSets.flat()` 的 index
建 `folderOrderMap`，排序時直接吃這個順序，所以 JSON 怎麼排，畫面就怎麼出。

正確排列規則：

1. **先依卡片類型**：主推卡（Oshi）→ 角色卡（Member）→ 支援卡（Support）
2. **主推卡與角色卡再依顏色**：白 → 綠 → 紅 → 藍 → 紫 → 黃
   （`white → green → red → blue → purple → yellow`）
3. 支援卡不分顏色，依既有慣例照卡號排

顏色順序已從 hBP01~hBP08 全部 8 彈的實際資料驗證，8 彈完全一致，
並經確認無誤：**紫在黃前面**。

多色卡（例如 `["red","blue"]`）依既有資料是插在第一個顏色的區塊內。

**現況：`cardList_hEB01.json` 還沒排序**，目前是照卡號 `localeCompare` 排的
（`fetch-set.cjs` 產出時的預設），所以型別和顏色是交錯的。
`fetch-set.cjs` 的輸出排序之後要改成上面的規則。

### 收工前跑一次健康檢查
用本文件最後的健檢腳本，兩個數字都要是 0：
- 孤兒圖片（有圖無索引）→ 忘了跑 `build:index`
- 版本錯誤（JSON versions 找不到對應圖）→ JSON 寫了不存在的版本，或圖還沒轉 webp

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

### 譯名變更的處理方式（2026-08-18 博衣こより 案例）
中文譯名改版時（`可佑理` → `小夜璃`），要動的地方有三處：
1. **tag**：`cardsConfig.jsx` 的 `allTags` + 各 cardList JSON 的 `tags`
2. **searchKeywords**：跨檔案散落各處，用腳本掃比較保險
3. **翻譯圖**：譯者重出的圖蓋掉舊檔（`process-images.ps1 -AutoRoute` 會自動歸位）

`searchKeywords` 的做法是**新譯名排前面、舊譯名保留在後**：
```json
["博衣こより", "博衣小夜璃", "博衣可佑理", "Hakui Koyori"]
```
直接取代會讓習慣舊稱呼的玩家搜不到，兩個都留沒有副作用。

同一角色的關聯字也要一起改：`AI可佑理`→`AI小夜璃`、`可佑理的助手君`→`小夜璃的助手君`。

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
