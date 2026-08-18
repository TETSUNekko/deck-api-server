// src/components/DeckBuilder/OddsModal.jsx —— 起手機率計算（不需要牌組滿 50 張）
import React, { useState, useMemo, useEffect } from "react";
import { atLeast } from "../../utils/odds";

const PRESETS = [
  { label: "起手摸到 Debut", mode: "grade", value: "debut", draw: 7, need: 1 },
  { label: "起手摸到 2 張 Debut", mode: "grade", value: "debut", draw: 7, need: 2 },
  { label: "前 3 回合摸到（10 張）", mode: "grade", value: "debut", draw: 10, need: 1 },
];

const COLOR_ZH = { white: "白", green: "綠", red: "紅", blue: "藍", purple: "紫", yellow: "黃" };

function OddsModal({ deckCards, onClose }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 620);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 620);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const [mode, setMode] = useState("grade");
  const [value, setValue] = useState("debut");
  const [draw, setDraw] = useState(7);
  const [need, setNeed] = useState(1);

  const N = deckCards.length;

  // 各模式的可選目標（只列牌組裡真的有的，避免選了永遠是 0%）
  const options = useMemo(() => {
    if (mode === "grade") {
      const g = [...new Set(deckCards.map(c => c.grade).filter(Boolean))];
      const order = ["debut", "1st", "buzz", "2nd", "spot"];
      return g.sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(v => ({ v, label: v }));
    }
    if (mode === "color") {
      const s = new Set();
      deckCards.forEach(c => (Array.isArray(c.color) ? c.color : []).forEach(x => s.add(x)));
      return [...s].map(v => ({ v, label: COLOR_ZH[v] || v }));
    }
    if (mode === "tag") {
      const s = new Set();
      deckCards.forEach(c => (Array.isArray(c.tags) ? c.tags : []).forEach(x => s.add(x)));
      return [...s].sort().map(v => ({ v, label: "#" + v }));
    }
    // card：同卡號合併，顯示張數
    const m = new Map();
    deckCards.forEach(c => m.set(c.id, { n: (m.get(c.id)?.n || 0) + 1, name: c.name || c.id }));
    return [...m].map(([id, { n, name }]) => ({ v: id, label: `${name}（${id}）×${n}` }));
  }, [mode, deckCards]);

  // 切換模式時，若目前的目標不在新清單裡就自動選第一個
  useEffect(() => {
    if (options.length && !options.some(o => o.v === value)) setValue(options[0].v);
  }, [options, value]);

  const K = useMemo(() => deckCards.filter(c => {
    if (mode === "grade") return c.grade === value;
    if (mode === "color") return Array.isArray(c.color) && c.color.includes(value);
    if (mode === "tag") return Array.isArray(c.tags) && c.tags.includes(value);
    return c.id === value;
  }).length, [deckCards, mode, value]);

  const p = atLeast(N, K, draw, need);
  const targetLabel = options.find(o => o.v === value)?.label || value;

  const sel = {
    fontSize: "13px", padding: "6px 10px", borderRadius: "8px",
    border: "1px solid #3d3155", background: "#2a2240",
    color: "#c9b8e0", outline: "none", fontFamily: "inherit",
  };
  const num = { ...sel, width: "60px" };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "12px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1e1830", border: "1px solid #3d3155", borderRadius: "16px",
        padding: isMobile ? "16px" : "24px", width: "100%", maxWidth: "460px",
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <span style={{ fontSize: "15px", color: "#c084fc", fontWeight: 600 }}>🎲 起手機率</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#4a3f5c",
            fontSize: "18px", cursor: "pointer", padding: "0 4px",
          }}>✕</button>
        </div>

        {N === 0 ? (
          <p style={{ fontSize: "13px", color: "#9b8ab0" }}>牌組裡還沒有卡片，先加幾張再回來算。</p>
        ) : (
          <>
            <div style={{ fontSize: "12px", color: N === 50 ? "#7c6fa0" : "#fbbf24", marginBottom: "12px" }}>
              主卡組 {N} 張{N !== 50 && "（未滿 50 張，以目前張數計算）"}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", fontSize: "13px", color: "#9b8ab0" }}>
              <span>抽</span>
              <input type="number" min="1" max={N} value={draw} style={num}
                onChange={e => setDraw(Math.max(1, Math.min(N, +e.target.value || 1)))} />
              <span>張，至少</span>
              <input type="number" min="1" max={N} value={need} style={num}
                onChange={e => setNeed(Math.max(1, Math.min(N, +e.target.value || 1)))} />
              <span>張</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              <select value={mode} onChange={e => setMode(e.target.value)} style={sel}>
                <option value="grade">Bloom 階級</option>
                <option value="color">顏色</option>
                <option value="tag">標籤</option>
                <option value="card">指定卡片</option>
              </select>
              <select value={value} onChange={e => setValue(e.target.value)} style={{ ...sel, flex: 1, minWidth: "140px" }}>
                {options.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>

            <div style={{
              margin: "16px 0", padding: "16px", borderRadius: "12px",
              background: "#231d33", border: "1px solid #2d2440", textAlign: "center",
            }}>
              <div style={{ fontSize: "32px", fontWeight: 600, color: p >= 0.8 ? "#5dbf94" : p >= 0.5 ? "#fbbf24" : "#f87171" }}>
                {(p * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "12px", color: "#7c6fa0", marginTop: "6px" }}>
                牌組裡符合「{targetLabel}」的有 {K} 張
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PRESETS.map(ps => (
                <button key={ps.label}
                  onClick={() => { setMode(ps.mode); setValue(ps.value); setDraw(ps.draw); setNeed(ps.need); }}
                  style={{
                    fontSize: "11px", padding: "5px 10px", borderRadius: "14px",
                    border: "1px solid #3d3155", background: "#2a2240",
                    color: "#c9b8e0", cursor: "pointer", fontFamily: "inherit",
                  }}>
                  {ps.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OddsModal;
