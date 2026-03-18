// src/components/DeckBuilder/CardImage.jsx
import React from "react";
import { ZoomIn } from "lucide-react";
import { webpUrlFromKey, ensureVersion } from "../../utils/imageIndex";

const warningMap = {
  "hBP01-010": "限制卡（一副牌中只能有一張）",
  "hBP01-014": "限制卡（一副牌中只能有一張）",
  "hBP01-030": "限制卡（一副牌中只能有一張）",
  "hBP02-094": "限制卡（一副牌中只能有一張）"
};

export default function CardImage({ card, version, className, style, onZoom, onClick }) {
  const safeVersion = ensureVersion(version || card.version);

  // ✅ 單一來源：一定用 card.key
  const imgSrc = card.key ? webpUrlFromKey(card.key) : null;

  return (
    <div
      className={`relative ${className || ""}`}
      style={style}
      onClick={() => onClick && onClick(card, safeVersion)}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={card.id}
          loading="lazy"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">
          缺圖
        </div>
      )}

      {/* 放大鏡按鈕 */}
      <button
        className="absolute top-0 left-0 p-0.5 text-white bg-black bg-opacity-50 hover:bg-opacity-80 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          if (imgSrc && onZoom) onZoom(imgSrc, card);
        }}
      >
        <ZoomIn size={20} />
      </button>

      {/* 限制卡提示 */}
      {warningMap[card.id] && (
        <div className="absolute top-0 right-0 m-0.5">
          <div
            className="w-5 h-5 bg-yellow-400 text-white text-xs font-bold rounded-tr-md rounded-bl-md flex items-center justify-center shadow"
            title={warningMap[card.id]}
          >
            !
          </div>
        </div>
      )}
    </div>
  );
}
