// src/components/DeckBuilder/ZoomModal.jsx
import { parseKey } from "../../utils/imageIndex";
import React, { useEffect, useState } from "react";

function ZoomModal({ card, imageUrl, onClose, onPrev, onNext }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!card || !imageUrl) return null;

  const entry = card.key ? parseKey(card.key) : null;
  const base = import.meta.env.BASE_URL || "/";
  let primary = null;
  let fallback = null;

  if (entry) {
    primary = `${base}webpcards/${entry.folder}-trans/${entry.id}.webp`;
    const prefix = entry.id.split("-")[0];
    fallback = `${base}webpcards/${prefix}-trans/${entry.id}.webp`;
  }

  const [showTranslated, setShowTranslated] = useState(true);

  const handleError = (e) => {
    if (primary && fallback && !e.currentTarget.dataset.fallback) {
      e.currentTarget.dataset.fallback = "true";
      e.currentTarget.src = fallback;
    } else {
      setShowTranslated(false);
    }
  };

  const cardId = card.id || "";
  const rutenUrl = `https://www.ruten.com.tw/find/?q=${encodeURIComponent(cardId)}`;
  const shopeeUrl = `https://shopee.tw/search?keyword=${encodeURIComponent(cardId)}`;

  const shopBtnStyle = {
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "6px 14px", borderRadius: "16px",
    fontSize: "12px", fontWeight: 500, cursor: "pointer",
    border: "1px solid", textDecoration: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "center" : "flex-start",
          justifyContent: "center",
          gap: "16px",
          padding: isMobile ? "16px 16px 80px" : "24px 80px",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 原圖 */}
        <img
          src={imageUrl}
          alt="原圖"
          style={{
            flex: "0 0 auto",
            maxHeight: isMobile ? "40vh" : "82vh",
            maxWidth: isMobile ? "55vw" : "none",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />

        {/* 右側：翻譯圖 + 賣場按鈕 */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "12px",
          flex: "0 0 auto",
        }}>
          {/* 翻譯圖 */}
          {primary && showTranslated && (
            <img
              src={primary}
              alt="翻譯圖"
              style={{
                maxHeight: isMobile ? "40vh" : "72vh",
                maxWidth: isMobile ? "85vw" : "none",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: "8px",
              }}
              onError={handleError}
            />
          )}

          {/* 賣場查卡按鈕 */}
          {cardId && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href={rutenUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...shopBtnStyle,
                  borderColor: "#e05c2a",
                  color: "#f87c4a",
                  background: "rgba(224,92,42,0.12)",
                }}
                onClick={e => e.stopPropagation()}
              >
                🛒 露天查卡
              </a>
              <a
                href={shopeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...shopBtnStyle,
                  borderColor: "#e05c2a",
                  color: "#f87c4a",
                  background: "rgba(224,92,42,0.12)",
                }}
                onClick={e => e.stopPropagation()}
              >
                🛍 蝦皮查卡
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 左箭頭 */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          style={{
            position: "fixed", left: "12px", top: "50%",
            transform: "translateY(-50%)",
            fontSize: "26px", color: "white",
            background: "rgba(0,0,0,0.45)", border: "none",
            borderRadius: "8px", padding: "8px 12px",
            cursor: "pointer", zIndex: 10001,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.75)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.45)"}
        >←</button>
      )}

      {/* 右箭頭 */}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          style={{
            position: "fixed", right: "12px", top: "50%",
            transform: "translateY(-50%)",
            fontSize: "26px", color: "white",
            background: "rgba(0,0,0,0.45)", border: "none",
            borderRadius: "8px", padding: "8px 12px",
            cursor: "pointer", zIndex: 10001,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.75)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.45)"}
        >→</button>
      )}

      {/* 關閉按鈕 */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "fixed", top: "16px", right: "16px",
          zIndex: 10001, background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white", borderRadius: "50%",
          width: "40px", height: "40px",
          fontSize: "18px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.8)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}
      >✕</button>
    </div>
  );
}

export default ZoomModal;
