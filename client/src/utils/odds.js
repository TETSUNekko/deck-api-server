// 超幾何分布：牌堆 N 張、其中 K 張是目標，抽 n 張時抽中 k 張的機率
// ponytail: 用對數階乘，50 張牌的組合數直接算會爆 double
const logFact = [0];
const lf = (n) => {
  while (logFact.length <= n) logFact.push(logFact[logFact.length - 1] + Math.log(logFact.length));
  return logFact[n];
};
const logC = (n, k) => (k < 0 || k > n || n < 0 ? -Infinity : lf(n) - lf(k) - lf(n - k));

export const exactly = (N, K, n, k) => {
  if (N <= 0 || n < 0 || n > N) return 0;
  const p = Math.exp(logC(K, k) + logC(N - K, n - k) - logC(N, n));
  return Number.isFinite(p) ? p : 0;
};

// 抽 n 張裡「至少 k 張」是目標的機率
export const atLeast = (N, K, n, k) => {
  if (k <= 0) return 1;
  let p = 0;
  for (let i = k; i <= Math.min(n, K); i++) p += exactly(N, K, n, i);
  return Math.min(1, Math.max(0, p));
};

// 多條件同時成立的機率（多變量超幾何分布）
// cells: [{ count, mask }]，mask 的第 j 個 bit = 這一格的卡符合第 j 個條件
//        同一張卡可以同時符合多個條件，所以先依「符合哪些條件」把牌組切成互斥的格子
// reqs:  [每個條件至少要抽到幾張]
//
// ponytail: 直接列舉每格抽幾張是 O(∏(count+1))，50 張牌會爆；
// 改成 DP 並把已滿足的數量壓到 need 上限（超過就不必再分辨），狀態數剩幾萬個。
export function atLeastJoint(cells, n, reqs) {
  const N = cells.reduce((s, c) => s + c.count, 0);
  if (N <= 0 || n < 0 || n > N) return 0;
  if (!reqs.length) return 1;

  const cap = (arr) => arr.map((g, j) => Math.min(g, reqs[j]));
  const memo = new Map();

  // 回傳「第 i 格之後，剩 left 張要抽」的所有組合的 ∏C(count, k) 總和（只計符合條件的）
  const walk = (i, left, got) => {
    if (i === cells.length) return left === 0 && got.every((g, j) => g >= reqs[j]) ? 1 : 0;
    const key = `${i}|${left}|${got}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;

    const { count, mask } = cells[i];
    let sum = 0;
    for (let k = 0; k <= Math.min(left, count); k++) {
      const next = cap(got.map((g, j) => (mask & (1 << j) ? g + k : g)));
      const sub = walk(i + 1, left - k, next);
      if (sub) sum += Math.exp(logC(count, k)) * sub;
    }
    memo.set(key, sum);
    return sum;
  };

  const p = walk(0, n, cap(reqs.map(() => 0))) / Math.exp(logC(N, n));
  return Math.min(1, Math.max(0, p));
}
