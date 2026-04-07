// src/components/DeckBuilder/DrawHandModal.jsx
import React, { useState, useCallback } from "react";
import CardImage from "./CardImage";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DrawHandModal({ deckCards, onClose, onZoom }) {
  const [hand, setHand] = useState(() => {
    const expanded = deckCards.flatMap(c =>
      Array.from({ length: c.count || 1 }, () => c)
    );
    return shuffle(expanded).slice(0, 7);
  });

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 620);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 620);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const redraw = useCallback(() => {
    const expanded = deckCards.flatMap(c =>
      Array.from({ length: c.count || 1 }, () => c)
    );
    setHand(shuffle(expanded).slice(0, 7));
  }, [deckCards]);

  // 手機版：前4張一排、後3張一排
  const firstRow = isMobile ? hand.slice(0, 4) : hand;
  const secondRow = isMobile ? hand.slice(4) : [];

  const cardStyle = {
    borderRadius: "6px", overflow: "hidden",
    border: "1.5px solid #3d3155",
    cursor: "pointer", flexShrink: 0,
    aspectRatio: "2/3",
  };

  const renderCard = (card, i) => (
    <div
      key={i}
      style={{
        ...cardStyle,
        width: isMobile ? "calc(25% - 6px)" : "160px",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#c084fc"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#3d3155"}
    >
      <CardImage
        card={card}
        version={card.version}
        onZoom={(url, cardData) => onZoom && onZoom(url, cardData)}
        onClick={() => {}}
      />
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#1e1830",
          border: "1px solid #3d3155",
          borderRadius: "16px",
          padding: isMobile ? "16px" : "24px",
          maxWidth: isMobile ? "98vw" : "90vw",
          width: isMobile ? "98vw" : "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* 標題 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "15px", color: "#c084fc", fontWeight: 600 }}>
            🃏 起手 7 張
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#4a3f5c",
              fontSize: "18px", cursor: "pointer", padding: "0 4px",
            }}
          >✕</button>
        </div>

        {/* 手機版：4+3 兩排；桌面版：7張一排 */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {firstRow.map((card, i) => renderCard(card, i))}
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {secondRow.map((card, i) => renderCard(card, i + 4))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {hand.map((card, i) => renderCard(card, i))}
          </div>
        )}

        {/* 重抽按鈕 */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          <button
            onClick={redraw}
            style={{
              padding: "8px 24px", borderRadius: "20px",
              border: "1px solid #6b3fa0", background: "#2d1e40",
              color: "#c084fc", fontSize: "13px", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#3d2d55"}
            onMouseLeave={e => e.currentTarget.style.background = "#2d1e40"}
          >
            🔀 重新抽手
          </button>
        </div>
      </div>
    </div>
  );
}

export default DrawHandModal;
