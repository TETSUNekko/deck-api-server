// 正規牌組檢查 —— 只回報問題，不阻擋任何操作
// ponytail: 只檢查官方明文的「構築」規則。LIMITED 是「1 回合 1 張」的使用限制、
// 不是構築限制，所以不列入；顏色與主推的關係也不是構築規則，同樣不檢查。
export function checkDeck(oshiCards, deckCards, energyCards) {
  const issues = [];

  if (oshiCards.length !== 1) {
    issues.push({ level: oshiCards.length ? "error" : "warn", text: `主推卡需要 1 張（目前 ${oshiCards.length} 張）` });
  }
  if (deckCards.length !== 50) {
    issues.push({ level: deckCards.length > 50 ? "error" : "warn", text: `主卡組需要 50 張（目前 ${deckCards.length} 張）` });
  }
  if (energyCards.length !== 20) {
    issues.push({ level: energyCards.length > 20 ? "error" : "warn", text: `能量卡需要 20 張（目前 ${energyCards.length} 張）` });
  }

  // 同一張卡（同卡號）最多 4 張 —— 不同版本卡圖算同一張
  // 能量卡不受此限（同色能量本來就會放很多張），所以只看主卡組
  for (const [id, n] of countById(deckCards)) {
    if (n > 4) {
      const name = deckCards.find(c => c.id === id)?.name || id;
      issues.push({ level: "error", text: `${name}（${id}）超過 4 張上限（目前 ${n} 張）` });
    }
  }

  return issues;
}

const countById = (cards) => {
  const m = new Map();
  cards.forEach(c => m.set(c.id, (m.get(c.id) || 0) + 1));
  return m;
};

export const overLimitIds = (deckCards) =>
  new Set([...countById(deckCards)].filter(([, n]) => n > 4).map(([id]) => id));
