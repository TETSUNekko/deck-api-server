// src/components/DeckBuilder/CardArea.jsx
import React from "react";
import CardImage from "./CardImage";

function CardArea({ filteredCards, onAddCard, onZoom }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      overflow: "hidden", height: "100%", background: "#1a1625",
    }}>
      {/* 標題列 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 12px", background: "#1e1830",
        borderBottom: "1px solid #2d2440", flexShrink: 0,
      }}>
        <span style={{ fontSize: "12px", color: "#9b8ab0", fontWeight: 500 }}>卡片列表</span>
        <span style={{ fontSize: "11px", color: "#4a3f5c" }}>{filteredCards.length} 張</span>
      </div>

      {/* 卡片格 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
        gridAutoRows: "165px",
        gap: "6px",
        alignContent: "flex-start",
      }}>
        {filteredCards.map((card) => (
          <div
            key={card.key}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1.5px solid #2d2440",
              height: "165px",
              transition: "border-color 0.15s, transform 0.1s",
            }}
            onClick={() => onAddCard(card, card.version)}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#6b3fa0";
              e.currentTarget.style.transform = "scale(1.03)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#2d2440";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <CardImage
              card={card}
              version={card.version}
              onZoom={(url, cardData) => {
                const index = filteredCards.findIndex(c => c.key === cardData.key);
                onZoom(url, cardData, index);
              }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "rgba(0,0,0,0.65)", color: "rgba(255,255,255,0.85)",
              fontSize: "9px", textAlign: "center", padding: "2px 4px",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {card.id} {card.version}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardArea;