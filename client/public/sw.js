// 只快取卡圖，不碰 HTML / JS / CSS。
// 卡圖是「內容不變、換圖就換檔名」的資源，所以可以放心 cache-first；
// 反過來如果連 app 本身也快取，改版後使用者會卡在舊版且很難清，不值得。
const CACHE = "holotcg-cards-v1";
const MAX_ENTRIES = 600;   // 約 600 張卡圖，手機端上限大概幾十 MB

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // 換 CACHE 版本號就能讓舊快取整批失效
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith("holotcg-cards-") && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// 超過上限就從最舊的開始刪（Cache API 的 keys() 是插入順序）
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map(k => cache.delete(k)));
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (!/\/webpcards\/.+\.webp$/.test(url.pathname)) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request);
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res.ok) { await cache.put(e.request, res.clone()); trim(cache); }
      return res;
    } catch (err) {
      // 離線且沒快取：讓瀏覽器顯示破圖，不要整頁掛掉
      return Response.error();
    }
  })());
});
