// App.jsx
import { useState } from "react";
import DeckBuilder from "./components/DeckBuilder";

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [deckData, setDeckData] = useState(null);

  const handleStart = () => {
    if (!playerName.trim()) {
      alert("請輸入玩家名稱！");
      return;
    }
    setSubmitted(true);
  };

  const handleDeckComplete = (data) => {
    console.log("✅ 玩家牌組完成：", data);
    setDeckData(data);
  };

  return (
    <div className="p-6 relative min-h-screen bg-yellow-50">
      {/* ✅ 右上角版權標示 */}
      <div className="absolute top-2 right-4 text-xs text-gray-400">
        © 2016 COVER Corp.
      </div>

      {!submitted ? (
        <div className="text-center mt-20">
          <h1 className="text-2xl mb-4">🔰 歡迎來到 HoloTCG 繁中卡表生成器</h1>
          <input
            type="text"
            placeholder="請輸入你的玩家名稱"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleStart}
          >
            開始組牌
          </button>

          {/* ✅ 新增警語文字 */}
          <p className="mt-5 text-xs text-gray-600 max-w-ld mx-auto">
            ※本工具所生成之卡表，不得作為官方比賽用。參加比賽請使用官方 decklog 製作卡表。https://decklog.bushiroad.com/create?c=9
          </p>
        </div>
      ) : !deckData ? (
        <DeckBuilder playerName={playerName} onDeckComplete={handleDeckComplete} />
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-bold">🎮 對戰準備中……</h2>
          <p>你已完成牌組：主推卡 + {deckData.deck.length} 張卡 + {deckData.energyCount} 張能量卡</p>
        </div>
      )}
    </div>
  );
}
