//App,jsx
// test update 0406
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
  <h1 className="text-red-500 text-2xl">這是一段紅字</h1>
  return (
    <div className="p-6">
      {!submitted ? (
        <div className="text-center">
          <h1 className="text-2xl mb-4">🔰 歡迎來到 HoloTCG 對戰系統</h1>
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

        </div>
      ) : !deckData ? (
        <DeckBuilder playerName={playerName} onDeckComplete={handleDeckComplete} />
      ) : (
        <div>
          <h2 className="text-xl">🎮 對戰準備中……</h2>
          <p>你已完成牌組：主推卡 + {deckData.deck.length} 張卡 + {deckData.energyCount} 張能量卡</p>
        </div>
      )}
    </div>
  );
}
