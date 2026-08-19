// src/components/DeckBuilder/MyDecksModal.jsx —— 本機多牌組存檔
import React, { useState } from "react";
import { listDecks, saveDeck, removeDeck, renameDeck } from "../../utils/deckStorage";

const fmt = (ts) => {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function MyDecksModal({ current, onLoad, onClose }) {
  const [decks, setDecks] = useState(listDecks);
  const [name, setName] = useState("");
  const refresh = () => setDecks(listDecks());

  const total = current.oshi.length + current.deck.length + current.energy.length;

  const doSave = () => {
    const n = name.trim();
    if (!n) return;
    if (decks.some(d => d.name === n) && !window.confirm(`已經有「${n}」了，要覆寫嗎？`)) return;
    if (!saveDeck(n, current)) { alert("❌ 儲存失敗，瀏覽器可能不允許本機儲存（無痕模式？）"); return; }
    setName("");
    refresh();
  };

  const btn = {
    fontSize: "11px", padding: "4px 10px", borderRadius: "12px",
    border: "1px solid #3d3155", background: "#2a2240",
    color: "#c9b8e0", cursor: "pointer", fontFamily: "inherit",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "12px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1e1830", border: "1px solid #3d3155", borderRadius: "16px",
        padding: "20px", width: "100%", maxWidth: "460px",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "15px", color: "#c084fc", fontWeight: 600 }}>📁 我的牌組</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#4a3f5c",
            fontSize: "18px", cursor: "pointer", padding: "0 4px",
          }}>✕</button>
        </div>

        {/* 存檔 */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          <input
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSave()}
            placeholder={`幫目前這副命名（${total} 張）`}
            style={{
              flex: 1, fontSize: "13px", padding: "7px 12px", borderRadius: "8px",
              border: "1px solid #3d3155", background: "#2a2240",
              color: "#c9b8e0", outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={doSave} disabled={!name.trim()} style={{
            ...btn, padding: "7px 14px", fontSize: "13px",
            borderColor: "#6b3fa0", color: "#c084fc", background: "#2d1e40",
            opacity: name.trim() ? 1 : 0.4, cursor: name.trim() ? "pointer" : "not-allowed",
          }}>存檔</button>
        </div>
        <div style={{ fontSize: "10px", color: "#4a3f5c", marginBottom: "12px" }}>
          存在你自己的瀏覽器裡，清除瀏覽資料就會不見。要長期保存或換裝置請用「分享代碼」。
        </div>

        {/* 清單 */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {decks.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#3d3155" }}>還沒有存檔的牌組。</p>
          ) : decks.map(d => (
            <div key={d.id} style={{
              padding: "9px 10px", marginBottom: "6px", borderRadius: "10px",
              background: "#231d33", border: "1px solid #2d2440",
              display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "130px" }}>
                <div style={{ fontSize: "13px", color: "#c9b8e0" }}>{d.name}</div>
                <div style={{ fontSize: "10px", color: "#4a3f5c" }}>
                  主推 {d.oshi.length}／主卡 {d.deck.length}／能量 {d.energy.length}　·　{fmt(d.updated)}
                </div>
              </div>
              <button style={{ ...btn, borderColor: "#2d6e50", color: "#5dbf94", background: "#1a3028" }}
                onClick={() => { onLoad(d); onClose(); }}>載入</button>
              <button style={btn} onClick={() => {
                const n = window.prompt("新名稱", d.name);
                if (n && n.trim()) { renameDeck(d.id, n.trim()); refresh(); }
              }}>改名</button>
              <button style={{ ...btn, color: "#f87171", borderColor: "#5a2a2a" }}
                onClick={() => { if (window.confirm(`刪除「${d.name}」？`)) { removeDeck(d.id); refresh(); } }}>刪除</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyDecksModal;
