// src/utils/sort.js

// 排序優先順序
export const TYPE_ORDER = [
  "debut", "1st", "buzz", "2nd",
  "spot", "staff", "item", "event",
  "tool", "mascot", "fan"
];

// 排序函式：依照卡片類型排序，並保持同類型卡片新增順序
export function sortDeckByType(deck) {
  return deck.slice().sort((a, b) => {
    const indexA = TYPE_ORDER.includes(a.sortType)
      ? TYPE_ORDER.indexOf(a.sortType)
      : TYPE_ORDER.length;
    const indexB = TYPE_ORDER.includes(b.sortType)
      ? TYPE_ORDER.indexOf(b.sortType)
      : TYPE_ORDER.length;

    if (indexA !== indexB) return indexA - indexB;
    return a.id.localeCompare(b.id);
  });
}
