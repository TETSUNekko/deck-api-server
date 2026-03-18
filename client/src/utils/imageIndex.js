// src/utils/imageIndex.js
import index from "../assets/imageIndex.json"; // { byKey, versionsById }

export const byKey = index.byKey || {};
export const versionsById = index.versionsById || {};

export const ensureVersion = (v) => (v ? v.replace(".png", "") : "_C");

// 解析 key -> { id, version, folder, rel }
export function parseKey(key) {
  if (!key || typeof key !== "string") return null;

  const [idver, folder] = key.split("@");
  if (!idver || !folder) return null;

  const m = idver.match(/^(h[A-Za-z]+[0-9]*-\d{3})(.*)$/);
  if (!m) return null;

  return {
    id: m[1],
    version: m[2] || "_C",
    folder,
    rel: byKey[key] || null,
  };
}

// 產生前端顯示用 webp 路徑
export function webpUrlFromKey(key) {
  if (!key) return null;
  const base = import.meta.env.BASE_URL || "/";
  const rel = byKey[key];
  return rel ? `${base}webpcards/${rel}` : null;
}
