// src/components/DeckBuilder/WelcomeModal.jsx
import React from "react";
import { changelog } from "../cardsConfig";

function WelcomeModal({ show, onClose }) {
  if (!show) return null;

  const reversedLog = [...changelog].reverse();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 10, 25, 0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#1e1830",
          border: "1px solid #3d3155",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 20px", textAlign: "center", borderBottom: "1px solid #2d2440" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
            marginBottom: "14px", background: "#2d1e40",
            border: "1px solid #6b3fa0", color: "#c084fc",
          }}>
            🔰 非營利個人專案
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#f0e6ff", margin: "0 0 8px" }}>
            HoloTCG 繁中卡表生成器
          </h2>
          <p style={{ fontSize: "12px", color: "#a090b8", lineHeight: 1.7, margin: 0 }}>
            本工具僅供玩家自用與測試，嚴禁用於任何商業用途。<br />
            所生成之卡表不得作為官方比賽用。官方 decklog 請見{" "}
            <a href="https://decklog-en.bushiroad.com/ja/create?c=108"
              target="_blank" rel="noreferrer"
              style={{ color: "#c084fc", textDecoration: "underline" }}>
              此連結
            </a>。
          </p>
        </div>

        {/* Changelog */}
        <div style={{ padding: "18px 28px" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "#c9b8e0", marginBottom: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            最近更新
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {reversedLog.map((log, i) => {
              const match = log.match(/^(\d+\/\d+)\s+更新內容\s*[:：]\s*(.+)$/);
              const date = match ? match[1] : null;
              const text = match ? match[2] : log;
              const isLatest = i < 2;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "8px 12px", borderRadius: "8px",
                  background: isLatest ? "#2d1e40" : "#231d33",
                  border: `1px solid ${isLatest ? "#6b3fa0" : "#2d2440"}`,
                }}>
                  {date && (
                    <span style={{
                      fontSize: "11px", fontWeight: 500, paddingTop: "1px",
                      flexShrink: 0, minWidth: "36px",
                      color: isLatest ? "#e879f9" : "#7c6fa0",
                    }}>
                      {date}
                    </span>
                  )}
                  <span style={{ fontSize: "12px", lineHeight: 1.5, color: isLatest ? "#f0e6ff" : "#a090b8" }}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px 24px", textAlign: "center", borderTop: "1px solid #2d2440" }}>
          <p style={{ fontSize: "11px", color: "#7c6fa0", marginBottom: "14px" }}>
            翻譯圖來源：鳳凰貓 Bushiroad Card Gamer
          </p>
          <button
            onClick={onClose}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 32px", borderRadius: "24px",
              fontSize: "13px", fontWeight: 500,
              background: "#3d2d55", border: "1px solid #6b3fa0", color: "#f0e6ff",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#4a3a66"}
            onMouseLeave={e => e.currentTarget.style.background = "#3d2d55"}
          >
            開始使用
          </button>
          <p style={{ fontSize: "11px", color: "#4a3f5c", marginTop: "10px" }}>
            或點擊任意處關閉
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;