// src/components/DeckBuilder/DeckArea.jsx
import React from "react";
import CardImage from "./CardImage";

const DeckArea = React.forwardRef(function DeckArea(
  {
    oshiCards,
    deckCards,
    energyCards,
    setOshiCards,
    setDeckCards,
    setEnergyCards,
    filteredCards,
    onZoom,
    deckVisible
  },
  ref
) {
  // ✅ 合併刪卡邏輯（用 index，刪除指定位置）
  const handleRemove = (setFn, index) => {
    setFn((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ 找 zoom index（用 key 或 id+version 判斷即可）
  const getZoomIndex = (cardData) => {
    return filteredCards.findIndex(
      (c) => c.id === cardData.id && c.version === cardData.version
    );
  };

  return (
    <div
      ref={ref}
      className={`
        ${deckVisible ? "block" : "hidden"}
        md:block
        bg-zinc-100 px-4 py-4 border-t md:border-t-0 md:border-l
        w-full md:w-[47%] z-10
        fixed md:static bottom-0 right-0
        h-[60vh] md:h-auto
        overflow-y-auto
      `}
    >
      <h3 className="text-lg font-bold mb-2">🗂 我的牌組</h3>

      {/* 主推卡 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold">
          🌟 主推卡（{oshiCards.length} / 1）：
        </h4>
        {oshiCards.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {oshiCards.map((card, index) => (
              <CardImage
                key={`${card.id}-${card.version}-oshi-${index}`}
                card={card}
                version={card.version}
                className="w-[clamp(45px,6vw,63px)] h-[clamp(65px,8.5vw,88px)]"
                onZoom={(url, cardData) =>
                  onZoom(url, cardData, getZoomIndex(cardData))
                }
                onClick={() => handleRemove(setOshiCards, index)} // ✅ 用 index 移除
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">尚未選擇主推卡</p>
        )}
      </div>

      {/* 主卡組 */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold">
          📦 主卡組 ({deckCards.length} / 50)：
        </h4>
        <div className="flex flex-wrap gap-1">
          {deckCards.map((card, index) => (
            <CardImage
              key={`${card.id}-${card.version}-deck-${index}`}
              card={card}
              version={card.version}
              className="w-[clamp(45px,6vw,63px)] h-[clamp(65px,8.5vw,88px)]"
              onZoom={(url, cardData) =>
                onZoom(url, cardData, getZoomIndex(cardData))
              }
              onClick={() => handleRemove(setDeckCards, index)} // ✅ 用 index 移除
            />
          ))}
        </div>
      </div>

      {/* 能量卡 */}
      <div>
        <h4 className="text-sm font-semibold">
          ⚡ 能量卡 ({energyCards.length} / 20)：
        </h4>
        <div className="flex flex-wrap gap-1">
          {energyCards.map((card, index) => (
            <CardImage
              key={`${card.id}-${card.version}-energy-${index}`}
              card={card}
              version={card.version}
              className="w-[clamp(45px,6vw,63px)] h-[clamp(65px,8.5vw,88px)]"
              onZoom={(url, cardData) =>
                onZoom(url, cardData, getZoomIndex(cardData))
              }
              onClick={() => handleRemove(setEnergyCards, index)} // ✅ 用 index 移除
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default DeckArea;
