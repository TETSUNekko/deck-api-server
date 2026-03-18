// src/utils/api.js
// 單一後端入口：本地用 localhost，其餘用 Railway（deck-api-server）
const API_BASE =
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:3001"
    : "https://deck-api-server-production.up.railway.app";

export { API_BASE };

/** 五碼：官方 decklog 匯入 */
export async function importDecklog(code) {
  const url = `${API_BASE}/import-decklog/${String(code).toUpperCase()}`;
  const res = await fetch(url); // 不帶 credentials / mode，避免多餘預檢
  if (!res.ok) throw new Error(`import-decklog failed: HTTP ${res.status}`);
  return res.json();
}

/** 六碼：讀取 */
export async function loadDeck(code) {
  const url = `${API_BASE}/load/${String(code).toUpperCase()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`load failed: HTTP ${res.status}`);
  return res.json();
}

/** 六碼：儲存（自動產碼），回 { code } */
export async function saveDeck(payload) {
  const res = await fetch(`${API_BASE}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`save failed: HTTP ${res.status}`);
  return res.json(); // => { code: "ABC123" }
}

export async function saveDeckAs(code, payload) {
  const res = await fetch(`${API_BASE}/save/${String(code).toUpperCase()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`save as failed: HTTP ${res.status}`);
  return res.json(); // => { success: true }
}

