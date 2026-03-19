// src/components/DeckBuilder/DeckArea.jsx
import React from "react";
import CardImage from "./CardImage";

const DeckArea = React.forwardRef(function DeckArea(
  { oshiCards, deckCards, energyCards, setOshiCards, setDeckCards, setEnergyCards, filteredCards, onZoom, deckVisible },
  ref
) {
  const handleRemove = (setFn, index) => setFn(prev => prev.filter((_, i) => i !== index));

  const getZoomIndex = (cardData) =>
    filteredCards.findIndex(c => c.id === cardData.id && c.version === cardData.version);

  const total = oshiCards.length + deckCards.length + energyCards.length;

  const sectionTitle = (label, count, max) => (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      marginBottom: "6px",
    }}>
      <span style={{ fontSize: "12px", color: "#9b8ab0", fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: "11px", padding: "1px 8px", borderRadius: "10px",
        background: count >= max ? "#2d1e40" : "#231d33",
        border: `1px solid ${count >= max ? "#6b3fa0" : "#2d2440"}`,
        color: count >= max ? "#e879f9" : "#7c6fa0",
      }}>
        {count} / {max}
      </span>
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        display: deckVisible ? "flex" : undefined,
        flexDirection: "column",
        background: "#1e1830",
        borderLeft: "1px solid #2d2440",
        height: "100%",
        overflow: "hidden",
      }}
      className={`${deckVisible ? "flex" : "hidden"} md:flex flex-col`}
    >
      {/* 標題列 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 12px", background: "#231d33",
        borderBottom: "1px solid #2d2440", flexShrink: 0,
      }}>
        <span style={{ fontSize: "12px", color: "#9b8ab0", fontWeight: 500 }}>我的牌組</span>
        <span style={{ fontSize: "11px", color: "#4a3f5c" }}>{total} 張</span>
      </div>

      {/* 牌組內容 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>

        {/* 主推卡 */}
        <div style={{ marginBottom: "14px" }}>
          {sectionTitle("🌟 主推卡", oshiCards.length, 1)}
          {oshiCards.length === 0
            ? <p style={{ fontSize: "11px", color: "#3d3155" }}>尚未選擇主推卡</p>
            : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {oshiCards.map((card, index) => (
                  <div
                    key={`oshi-${index}`}
                    style={{
                      width: "clamp(40px, 5vw, 56px)",
                      aspectRatio: "2/3",
                      borderRadius: "4px",
                      overflow: "hidden",
                      border: "1.5px solid #3d3155",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#e879f9"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#3d3155"}
                  >
                    <CardImage
                      card={card} version={card.version}
                      className="w-full h-full"
                      onZoom={(url, cardData) => onZoom(url, cardData, getZoomIndex(cardData))}
                      onClick={() => handleRemove(setOshiCards, index)}
                    />
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* 主卡組 */}
        <div style={{ marginBottom: "14px" }}>
          {sectionTitle("📦 主卡組", deckCards.length, 50)}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {deckCards.map((card, index) => (
              <div
                key={`deck-${index}`}
                style={{
                  width: "clamp(40px, 5vw, 56px)",
                  aspectRatio: "2/3",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: "1.5px solid #3d3155",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#c084fc"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#3d3155"}
              >
                <CardImage
                  card={card} version={card.version}
                  className="w-full h-full"
                  onZoom={(url, cardData) => onZoom(url, cardData, getZoomIndex(cardData))}
                  onClick={() => handleRemove(setDeckCards, index)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 能量卡 */}
        <div>
          {sectionTitle("⚡ 能量卡", energyCards.length, 20)}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {energyCards.map((card, index) => (
              <div
                key={`energy-${index}`}
                style={{
                  width: "clamp(40px, 5vw, 56px)",
                  aspectRatio: "2/3",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: "1.5px solid #3d3155",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#5dbf94"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#3d3155"}
              >
                <CardImage
                  card={card} version={card.version}
                  className="w-full h-full"
                  onZoom={(url, cardData) => onZoom(url, cardData, getZoomIndex(cardData))}
                  onClick={() => handleRemove(setEnergyCards, index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部總計 */}
      <div style={{
        padding: "8px 12px", borderTop: "1px solid #2d2440",
        display: "flex", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "11px", color: "#4a3f5c" }}>總計</span>
        <span style={{ fontSize: "11px", color: "#c084fc", fontWeight: 500 }}>{total} 張</span>
      </div>
    </div>
  );
});

export default DeckArea;