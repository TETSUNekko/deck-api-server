// src/components/DeckBuilder/CardImage.jsx
import React from "react";
import { ZoomIn } from "lucide-react";
import { webpUrlFromKey, ensureVersion } from "../../utils/imageIndex";

const warningMap = {
  "hBP01-010": "限制卡（一副牌中只能有一張）",
  "hBP01-014": "限制卡（一副牌中只能有一張）",
  "hBP01-030": "限制卡（一副牌中只能有一張）",
  "hBP02-094": "限制卡（一副牌中只能有一張）",
};

export default function CardImage({ card, version, className, style, onZoom, onClick }) {
  const safeVersion = ensureVersion(version || card.version);
  const imgSrc = card.key ? webpUrlFromKey(card.key) : null;

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
      onClick={() => onClick && onClick(card, safeVersion)}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={card.id}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#2a2240", fontSize: "11px", color: "#4a3f5c",
        }}>
          缺圖
        </div>
      )}

      {/* 放大鏡按鈕 */}
      <button
        style={{
          position: "absolute", top: 0, left: 0,
          padding: "2px", color: "white",
          background: "rgba(0,0,0,0.5)", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center",
          borderRadius: "0 0 4px 0",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (imgSrc && onZoom) onZoom(imgSrc, card);
        }}
      >
        <ZoomIn size={14} />
      </button>

      {/* 限制卡提示 */}
      {warningMap[card.id] && (
        <div style={{ position: "absolute", top: "2px", right: "2px" }}>
          <div
            style={{
              width: "16px", height: "16px",
              background: "#f0c060", color: "#412402",
              fontSize: "10px", fontWeight: 700,
              borderRadius: "3px 3px 0 3px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={warningMap[card.id]}
          >
            !
          </div>
        </div>
      )}
    </div>
  );
}