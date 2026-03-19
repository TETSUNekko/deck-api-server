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

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* 圖片容器 */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
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
            flex: "1 1 0",
            minWidth: 0,
            maxHeight: isMobile ? "45vh" : "85vh",
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />

        {/* 翻譯圖 */}
        {primary && showTranslated && (
          <img
            src={primary}
            alt="翻譯圖"
            style={{
              flex: "1 1 0",
              minWidth: 0,
              maxHeight: isMobile ? "45vh" : "85vh",
              width: "100%",
              height: "auto",
              objectFit: "contain",
              borderRadius: "8px",
            }}
            onError={handleError}
          />
        )}
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