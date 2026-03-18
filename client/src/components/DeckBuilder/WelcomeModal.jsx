// src/components/DeckBuilder/WelcomeModal.jsx
import React from "react";
import { changelog } from "../cardsConfig";

function WelcomeModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-amber-50 to-white text-center px-10 py-8 rounded-xl shadow-xl max-w-2xl w-[90%] min-h-[300px] max-h-screen overflow-y-auto flex flex-col justify-center items-center space-y-6"
        //onClick={(e) => e.stopPropagation()} // 避免點內部直接關掉
      >
        <h2 className="text-2xl font-bold text-gray-800">
          🔰 歡迎來到 HoloTCG 繁中卡表生成器
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          本工具為非營利個人專案，僅供玩家自用與測試。
          <br />
          嚴禁將本工具所生成之內容用於任何形式之商業用途。
          <br />
          ※本工具所生成之卡表，不得作為官方比賽用。
          <br />
          官方 decklog 製作卡表請見：
          <a
            href="https://decklog-en.bushiroad.com/ja/create?c=108"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline ml-1"
          >
            連結
          </a>
        </p>

        <div className="w-full text-left">
          <h3 className="text-lg font-semibold mb-2">📜 更新內容</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {changelog.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-gray-400">點擊任意處以開始使用</p>
      </div>
    </div>
  );
}

export default WelcomeModal;
