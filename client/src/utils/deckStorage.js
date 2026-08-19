// 牌組存在瀏覽器本機（localStorage）。只存 imageIndex 的 key 字串，
// 一副牌約 1KB，放幾百副都不會碰到 5MB 上限。
const DECKS = "holotcg.decks";
const CURRENT = "holotcg.current";

const read = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }   // 手動改壞或舊格式殘留時不要整站掛掉
};
const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; }
  catch { return false; }      // 無痕模式 / 容量滿
};

// 卡片陣列 → key 陣列（同一張重複幾次就存幾個，還原時順序不變）
export const toKeys = (cards) => cards.map(c => c.key).filter(Boolean);

export const listDecks = () => read(DECKS, []);

export const saveDeck = (name, payload) => {
  const decks = listDecks();
  const now = Date.now();
  const i = decks.findIndex(d => d.name === name);
  const entry = { id: i >= 0 ? decks[i].id : String(now), name, updated: now, ...payload };
  if (i >= 0) decks[i] = entry; else decks.unshift(entry);
  return write(DECKS, decks) ? entry : null;
};

export const removeDeck = (id) => write(DECKS, listDecks().filter(d => d.id !== id));

export const renameDeck = (id, name) =>
  write(DECKS, listDecks().map(d => (d.id === id ? { ...d, name, updated: Date.now() } : d)));

// 編輯中的暫存：關掉分頁再回來不會白做
export const loadCurrent = () => read(CURRENT, null);
export const saveCurrent = (payload) => write(CURRENT, payload);
