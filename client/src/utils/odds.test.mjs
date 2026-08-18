// node client/src/utils/odds.test.mjs
import assert from "node:assert";
import { exactly, atLeast } from "./odds.js";

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

// 全部都是目標 → 一定抽到
near(atLeast(50, 50, 7, 1), 1, "K=N");
// 沒有目標 → 一定抽不到
near(atLeast(50, 0, 7, 1), 0, "K=0");
// 機率分布加總為 1
near([0, 1, 2, 3, 4, 5, 6, 7].reduce((s, k) => s + exactly(50, 12, 7, k), 0), 1, "sum=1");
// 手算對照：50 張含 1 張目標，抽 7 張命中 = 7/50
near(atLeast(50, 1, 7, 1), 7 / 50, "single copy");
// 至少 0 張永遠成立、要求超過總數則為 0
near(atLeast(50, 12, 7, 0), 1, "k=0");
near(atLeast(50, 3, 7, 4), 0, "k>K");
// 邊界：抽的比牌堆多、空牌堆
near(exactly(5, 2, 9, 1), 0, "n>N");
near(atLeast(0, 0, 7, 1), 0, "empty deck");
// 常見案例：50 張 15 張 Debut，起手 7 張至少 1 張
// 對照手算 1 - C(35,7)/C(50,7) = 1 - 6724520/99884400 = 0.93268...
near(Math.round(atLeast(50, 15, 7, 1) * 1e5) / 1e5, 0.93268, "15 debut");

console.log("odds.js OK");
