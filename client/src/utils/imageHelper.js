import { getImagePath, versionsById } from "./imageIndex";

// 版本正規化：去副檔名、加底線
export const ensureVersion = (v) => {
  if (!v) return "_C";
  const s = String(v).replace(".png", "").replace(".webp", "");
  return s.startsWith("_") ? s : `_${s}`;
};

// 版本挑選（先 exact 命中，否則用索引中該 ID 的第一個版本做保底）
export const pickBestVersion = (id, wantedVersion) => {
  const ver = ensureVersion(wantedVersion);
  if (getImagePath(`${id}${ver}`)) return ver;
  const candidates = versionsById[id];
  if (Array.isArray(candidates) && candidates.length) return candidates[0];
  return "_C";
};

// 以索引找出最終圖片路徑（包含哪個資料夾）
export const buildImagePath = (id, version) => {
  const v = pickBestVersion(id, version);
  return getImagePath(`${id}${v}`) || null;
};
