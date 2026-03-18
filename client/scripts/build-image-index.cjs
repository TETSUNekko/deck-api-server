// scripts/build-image-index.js
/* 作用：
 * 掃描 public/webpcards/** 下所有圖片，生成 src/assets/imageIndex.json
 * 讓前端只要用 (id + version) -> 直接查到正確的相對路徑（含資料夾）
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../public/webpcards"); // webpcards 根目錄
const OUTPUT_JSON = path.join(__dirname, "../src/assets/imageIndex.json"); // 存到 src/assets

// 你現有版本順序，後面前端 fallback 也會用到（這裡只是參考）
const VERSION_ORDER = [
  "_C", "_C_2", "_C_02", "_U", "_U_2", "_U_02",
  "_S", "_02_S", "_S_02",
  "_P", "_P_1", "_P_2", "_P_3", "_P_02", "_02_P",
  "_R", "_R_02", "_RR", "_RR_02", "_SR", "_UR", "_HR", "_SEC"
];

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (/-trans$/i.test(name)) continue;   // ✅ 完全跳過翻譯圖資料夾
      out.push(...walk(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

// 從檔名抽出 id + 版本（version）
function parseIdAndVersion(basename /* 不含副檔名 */) {
  // 例：hBP04-009_P_02、hBP01-013_R、hY01-001（沒尾碼）
  const m = basename.match(/^([hH][A-Za-z]+[0-9]*-\d{2,3})(.*)$/);
  if (!m) return null;
  const id = m[1];
  let version = m[2] || "";
  // 統一慣例：沒有版本尾碼就視為 "_C"
  if (version === "") version = "_C";
  return { id, version };
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error("[image-index] 找不到 public/webpcards 目錄");
    process.exit(1);
  }

  const files = walk(ROOT)
    .filter(p => p.endsWith(".webp") || p.endsWith(".png"));

  // 若同名 .webp / .png 同時存在，優先 .webp
  const bestOf = new Map(); // key: relPath without ext -> ext
  for (const abs of files) {
    const rel = path.relative(ROOT, abs);
    const noExt = rel.replace(/\.(webp|png)$/i, "");
    const ext = path.extname(rel).toLowerCase();
    const prev = bestOf.get(noExt);
    if (!prev || (prev === ".png" && ext === ".webp")) {
      bestOf.set(noExt, ext);
    }
  }

  const byKey = {};          // "hBP04-009_P_02" => "hPR/hBP04-009_P_02.webp"
  const versionsById = {};   // "hBP04-009" => ["_P_02","_P",...]

  for (const [noExt, ext] of bestOf.entries()) {
    const relWithBestExt = `${noExt}${ext}`; // e.g. hPR/hBP04-009_P_02.webp
    if (relWithBestExt.includes("-trans/")) continue; // ✅ 雙保險，路徑包含 -trans 也跳過
    const base = path.basename(noExt);       // e.g. hBP04-009_P_02
    const parsed = parseIdAndVersion(base);
    if (!parsed) continue;
    const { id, version } = parsed;

    const key = `${id}${version}@${path.dirname(relWithBestExt).split(path.sep)[0]}`; // e.g. hBP04-009_P_02
    byKey[key] = relWithBestExt.replace(/\\/g, "/");

    if (!versionsById[id]) versionsById[id] = [];
    if (!versionsById[id].includes(version)) versionsById[id].push(version);
  }

  // （可選）按你的喜好排序版本
  for (const id of Object.keys(versionsById)) {
    versionsById[id].sort((a, b) => {
      const ia = VERSION_ORDER.indexOf(a); 
      const ib = VERSION_ORDER.indexOf(b);
      const sa = ia === -1 ? 999 : ia;
      const sb = ib === -1 ? 999 : ib;
      return sa - sb;
    });
  }

  const out = { byKey, versionsById };
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(out, null, 2), "utf-8");
  console.log(`[image-index] ✅ 產生完成：${OUTPUT_JSON}`);
}

main();
