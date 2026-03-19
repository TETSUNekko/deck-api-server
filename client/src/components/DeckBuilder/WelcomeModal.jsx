// src/components/DeckBuilder/WelcomeModal.jsx
import React from "react";
import { changelog } from "../cardsConfig";

function WelcomeModal({ show, onClose }) {
  if (!show) return null;

  // 反轉陣列：最新的顯示在最上方
  const reversedLog = [...changelog].reverse();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 10, 25, 0.92)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#1e1830", border: "1px solid #3d3155" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-6 pb-5 text-center" style={{ borderBottom: "1px solid #2d2440" }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4"
            style={{ background: "#2d1e40", border: "1px solid #6b3fa0", color: "#c084fc" }}
          >
            🔰 非營利個人專案
          </div>
          <h2 className="text-xl font-medium mb-2" style={{ color: "#f0e6ff" }}>
            HoloTCG 繁中卡表生成器
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: "#a090b8" }}>
            本工具僅供玩家自用與測試，嚴禁用於任何商業用途。
            <br />
            所生成之卡表不得作為官方比賽用。官方 decklog 請見{" "}
            <a
              href="https://decklog-en.bushiroad.com/ja/create?c=108"
              target="_blank"
              rel="noreferrer"
              className="underline"
              style={{ color: "#c084fc" }}
            >
              此連結
            </a>
            。
          </p>
        </div>

        {/* Changelog */}
        <div className="px-7 py-5">
          <p className="text-xs font-medium mb-3 tracking-widest uppercase" style={{ color: "#c9b8e0" }}>
            最近更新
          </p>
          <div className="flex flex-col gap-2">
            {reversedLog.map((log, i) => {
              const match = log.match(/^(\d+\/\d+)\s+更新內容\s*[:：]\s*(.+)$/);
              const date = match ? match[1] : null;
              const text = match ? match[2] : log;
              const isLatest = i < 2;

              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg"
                  style={{
                    background: isLatest ? "#2d1e40" : "#231d33",
                    border: `1px solid ${isLatest ? "#6b3fa0" : "#2d2440"}`,
                  }}
                >
                  {date && (
                    <span
                      className="text-xs font-medium pt-0.5 shrink-0 w-10"
                      style={{ color: isLatest ? "#e879f9" : "#7c6fa0" }}
                    >
                      {date}
                    </span>
                  )}
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: isLatest ? "#f0e6ff" : "#a090b8" }}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 pt-4 text-center" style={{ borderTop: "1px solid #2d2440" }}>
          <p className="text-xs mb-4" style={{ color: "#7c6fa0" }}>
            翻譯圖來源：鳳凰貓 Bushiroad Card Gamer
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
            style={{ background: "#3d2d55", border: "1px solid #6b3fa0", color: "#f0e6ff" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4a3a66")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3d2d55")}
          >
            開始使用
          </button>
          <p className="text-xs mt-3" style={{ color: "#4a3f5c" }}>
            或點擊任意處關閉
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;