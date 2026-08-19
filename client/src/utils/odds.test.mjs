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

// ── atLeastJoint ──
import { atLeastJoint } from "./odds.js";

// 單一條件時要跟 atLeast 完全一致
near(atLeastJoint([{ count: 15, mask: 1 }, { count: 35, mask: 0 }], 7, [1]),
     atLeast(50, 15, 7, 1), "joint = atLeast (1 cond)");
near(atLeastJoint([{ count: 12, mask: 1 }, { count: 38, mask: 0 }], 7, [2]),
     atLeast(50, 12, 7, 2), "joint = atLeast (need 2)");

// 兩個條件完全重疊（同一批卡）→ 等同單一條件取較嚴格的需求
near(atLeastJoint([{ count: 10, mask: 3 }, { count: 40, mask: 0 }], 7, [1, 2]),
     atLeast(50, 10, 7, 2), "fully overlapping");

// 聯合機率不會大於任一單獨條件
const joint = atLeastJoint([{ count: 8, mask: 1 }, { count: 6, mask: 2 }, { count: 36, mask: 0 }], 7, [1, 1]);
assert.ok(joint <= atLeast(50, 8, 7, 1) + 1e-12, "joint <= P(A)");
assert.ok(joint <= atLeast(50, 6, 7, 1) + 1e-12, "joint <= P(B)");
assert.ok(joint > 0, "joint > 0");

// 互斥兩組各要 1 張，手算對照：1 - P(無A) - P(無B) + P(兩者都無)
const c = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
const expect = 1 - c(42, 7) / c(50, 7) - c(44, 7) / c(50, 7) + c(36, 7) / c(50, 7);
near(Math.round(joint * 1e9) / 1e9, Math.round(expect * 1e9) / 1e9, "inclusion-exclusion");

// 要求超過該條件的總張數 → 0
near(atLeastJoint([{ count: 3, mask: 1 }, { count: 47, mask: 0 }], 7, [4]), 0, "need > available");
// 抽的比牌堆多
near(atLeastJoint([{ count: 3, mask: 1 }], 9, [1]), 0, "n > N");

console.log("atLeastJoint OK");
