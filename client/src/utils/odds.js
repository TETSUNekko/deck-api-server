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
