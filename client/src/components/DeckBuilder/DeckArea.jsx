// src/components/DeckBuilder/DeckArea.jsx
import React, { useEffect, useState } from "react";
import CardImage from "./CardImage";

const DeckArea = React.forwardRef(function DeckArea(
  { oshiCards, deckCards, energyCards, setOshiCards, setDeckCards, setEnergyCards, filteredCards, onZoom, deckVisible },
  ref
) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cardSize, setCardSize] = useState(56);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const handleRemove = (setFn, index) => setFn(prev => prev.filter((_, i) => i !== index));

  const getZoomIndex = (cardData) =>
    filteredCards.findIndex(c => c.id === cardData.id && c.version === cardData.version);

  const total = oshiCards.length + deckCards.length + energyCards.length;

  if (isMobile && !deckVisible) return null;

  const sectionTitle = (label, count, max) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
      <span style={{ fontSize: "12px", color: "#9b8ab0", fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: "11px", padding: "1px 8px", borderRadius: "10px",
        background: count > max ? "#3d1e20" : count >= max ? "#2d1e40" : "#231d33",
        border: `1px solid ${count > max ? "#e84040" : count >= max ? "#6b3fa0" : "#2d2440"}`,
        color: count > max ? "#f87171" : count >= max ? "#e879f9" : "#7c6fa0",
      }}>
        {count} / {max}
      </span>
    </div>
  );

  const cardStyle = {
    width: `${cardSize}px`,
    aspectRatio: "2/3",
    borderRadius: "4px",
    overflow: "hidden",
    border: "1.5px solid #3d3155",
    cursor: "pointer",
    flexShrink: 0,
    transition: "border-color 0.15s",
  };

  const renderCards = (cards, setFn, hoverColor, prefix) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {cards.map((card, index) => (
        <div
          key={`${prefix}-${index}`}
          style={cardStyle}
          onMouseEnter={e => e.currentTarget.style.borderColor = hoverColor}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#3d3155"}
        >
          <CardImage
            card={card} version={card.version}
            onZoom={(url, cardData) => onZoom(url, cardData, getZoomIndex(cardData))}
            onClick={() => handleRemove(setFn, index)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        display: "flex", flexDirection: "column",
        background: "#1e1830",
        borderLeft: "1px solid #2d2440",
        height: "100%", overflow: "hidden",
        ...(isMobile ? {
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: "60vh", zIndex: 100,
          borderTop: "1px solid #2d2440", borderLeft: "none",
        } : {}),
      }}
    >
      {/* 標題列 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 12px", background: "#231d33",
        borderBottom: "1px solid #2d2440", flexShrink: 0,
      }}>
        <span style={{ fontSize: "12px", color: "#9b8ab0", fontWeight: 500 }}>我的牌組</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => setCardSize(s => Math.max(36, s - 8))}
            style={{
              width: "20px", height: "20px", borderRadius: "4px",
              background: "#2a2240", border: "1px solid #3d3155",
              color: "#c9b8e0", fontSize: "14px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1, padding: 0,
            }}
          >−</button>
          <span style={{ fontSize: "10px", color: "#c9b8e0", minWidth: "28px", textAlign: "center" }}>
            {cardSize}px
          </span>
          <button
            onClick={() => setCardSize(s => Math.min(100, s + 8))}
            style={{
              width: "20px", height: "20px", borderRadius: "4px",
              background: "#2a2240", border: "1px solid #3d3155",
              color: "#9b8ab0", fontSize: "14px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1, padding: 0,
            }}
          >+</button>
          <span style={{ fontSize: "11px", color: "#c9b8e0", marginLeft: "4px" }}>{total} 張</span>
        </div>
      </div>

      {/* 牌組內容 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        <div style={{ marginBottom: "14px" }}>
          {sectionTitle("🌟 主推卡", oshiCards.length, 1)}
          {oshiCards.length === 0
            ? <p style={{ fontSize: "11px", color: "#3d3155" }}>尚未選擇主推卡</p>
            : renderCards(oshiCards, setOshiCards, "#e879f9", "oshi")
          }
        </div>

        <div style={{ marginBottom: "14px" }}>
          {sectionTitle("📦 主卡組", deckCards.length, 50)}
          {deckCards.length === 0
            ? <p style={{ fontSize: "11px", color: "#3d3155" }}>尚未選擇主卡</p>
            : renderCards(deckCards, setDeckCards, "#c084fc", "deck")
          }
        </div>

        <div>
          {sectionTitle("⚡ 能量卡", energyCards.length, 20)}
          {energyCards.length === 0
            ? <p style={{ fontSize: "11px", color: "#3d3155" }}>尚未選擇能量卡</p>
            : renderCards(energyCards, setEnergyCards, "#5dbf94", "energy")
          }
        </div>
      </div>

      {/* 底部總計 */}
      <div style={{
        padding: "8px 12px", borderTop: "1px solid #2d2440",
        display: "flex", justifyContent: "space-between", flexShrink: 0,
      }}>
        <span style={{ fontSize: "11px", color: "#c9b8e0" }}>總計</span>
        <span style={{ fontSize: "11px", color: "#c084fc", fontWeight: 500 }}>{total} 張</span>
      </div>
    </div>
  );
});

export default DeckArea;