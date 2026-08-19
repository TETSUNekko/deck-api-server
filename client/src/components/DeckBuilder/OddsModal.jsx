// src/components/DeckBuilder/OddsModal.jsx —— 起手機率（不需要牌組滿 50 張，可疊多個條件）
import React, { useState, useMemo, useEffect } from "react";
import { atLeastJoint } from "../../utils/odds";

const MAX_CONDS = 3;

const PRESETS = [
  { label: "起手摸到 Debut", draw: 7, conds: [{ mode: "grade", value: "debut", need: 1 }] },
  { label: "起手摸到 2 張 Debut", draw: 7, conds: [{ mode: "grade", value: "debut", need: 2 }] },
  { label: "前 3 回合摸到（10 張）", draw: 10, conds: [{ mode: "grade", value: "debut", need: 1 }] },
];

const COLOR_ZH = { white: "白", green: "綠", red: "紅", blue: "藍", purple: "紫", yellow: "黃" };
const MODE_ZH = { grade: "Bloom 階級", color: "顏色", tag: "標籤", card: "指定卡片" };

// 一張卡是否符合某個條件
const matches = (card, { mode, value }) => {
  if (mode === "grade") return card.grade === value;
  if (mode === "color") return Array.isArray(card.color) && card.color.includes(value);
  if (mode === "tag") return Array.isArray(card.tags) && card.tags.includes(value);
  return card.id === value;
};

function OddsModal({ deckCards, onClose }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 620);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 620);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const [draw, setDraw] = useState(7);
  const [conds, setConds] = useState([{ mode: "grade", value: "debut", need: 1 }]);

  const N = deckCards.length;
  const setCond = (i, patch) => setConds(cs => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  // 各模式可選的目標（只列牌組裡真的有的，避免選到永遠 0%）
  const optionsFor = useMemo(() => (mode) => {
    if (mode === "grade") {
      const order = ["debut", "1st", "buzz", "2nd", "spot"];
      return [...new Set(deckCards.map(c => c.grade).filter(Boolean))]
        .sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(v => ({ v, label: v }));
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
    const m = new Map();
    deckCards.forEach(c => m.set(c.id, { n: (m.get(c.id)?.n || 0) + 1, name: c.name || c.id }));
    return [...m].map(([id, { n, name }]) => ({ v: id, label: `${name}（${id}）×${n}` }));
  }, [deckCards]);

  // 目標不在清單裡就自動換成第一個
  useEffect(() => {
    setConds(cs => cs.map(c => {
      const opts = optionsFor(c.mode);
      return opts.length && !opts.some(o => o.v === c.value) ? { ...c, value: opts[0].v } : c;
    }));
  }, [optionsFor]);

  // 依「符合哪幾個條件」把牌組切成互斥的格子，重疊的卡才不會被重複計算
  const { cells, counts } = useMemo(() => {
    const byMask = new Map();
    const counts = conds.map(() => 0);
    deckCards.forEach(card => {
      let mask = 0;
      conds.forEach((cond, j) => {
        if (matches(card, cond)) { mask |= 1 << j; counts[j]++; }
      });
      byMask.set(mask, (byMask.get(mask) || 0) + 1);
    });
    return { cells: [...byMask].map(([mask, count]) => ({ count, mask })), counts };
  }, [deckCards, conds]);

  const p = atLeastJoint(cells, draw, conds.map(c => c.need));

  const sel = {
    fontSize: "13px", padding: "6px 10px", borderRadius: "8px",
    border: "1px solid #3d3155", background: "#2a2240",
    color: "#c9b8e0", outline: "none", fontFamily: "inherit",
  };
  const num = { ...sel, width: "58px" };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "12px",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1e1830", border: "1px solid #3d3155", borderRadius: "16px",
        padding: isMobile ? "16px" : "24px", width: "100%", maxWidth: "480px",
        maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
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
              <span>張，同時滿足以下條件：</span>
            </div>

            {conds.map((cond, i) => {
              const opts = optionsFor(cond.mode);
              return (
                <div key={i} style={{
                  marginTop: "10px", padding: "10px", borderRadius: "10px",
                  background: "#231d33", border: "1px solid #2d2440",
                }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", fontSize: "13px", color: "#9b8ab0" }}>
                    <span>至少</span>
                    <input type="number" min="1" max={N} value={cond.need} style={num}
                      onChange={e => setCond(i, { need: Math.max(1, Math.min(N, +e.target.value || 1)) })} />
                    <span>張</span>
                    <select value={cond.mode} style={sel}
                      onChange={e => {
                        const mode = e.target.value;
                        setCond(i, { mode, value: (optionsFor(mode)[0] || {}).v || "" });
                      }}>
                      {Object.entries(MODE_ZH).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                    {conds.length > 1 && (
                      <button onClick={() => setConds(cs => cs.filter((_, j) => j !== i))}
                        title="移除這個條件"
                        style={{
                          marginLeft: "auto", background: "none", border: "none",
                          color: "#4a3f5c", fontSize: "15px", cursor: "pointer", padding: "0 4px",
                        }}>✕</button>
                    )}
                  </div>
                  <select value={cond.value} onChange={e => setCond(i, { value: e.target.value })}
                    style={{ ...sel, width: "100%", marginTop: "6px" }}>
                    {opts.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                  </select>
                  <div style={{ fontSize: "11px", color: counts[i] < cond.need ? "#f87171" : "#7c6fa0", marginTop: "5px" }}>
                    牌組裡有 {counts[i]} 張{counts[i] < cond.need && "　← 少於要求張數，機率必定為 0"}
                  </div>
                </div>
              );
            })}

            {conds.length < MAX_CONDS && (
              <button
                onClick={() => setConds(cs => [...cs, { mode: "tag", value: (optionsFor("tag")[0] || {}).v || "", need: 1 }])}
                style={{
                  marginTop: "8px", width: "100%", padding: "7px", borderRadius: "8px",
                  border: "1px dashed #3d3155", background: "transparent",
                  color: "#9b8ab0", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                }}>
                ＋ 再加一個條件
              </button>
            )}

            <div style={{
              margin: "16px 0", padding: "16px", borderRadius: "12px",
              background: "#231d33", border: "1px solid #2d2440", textAlign: "center",
            }}>
              <div style={{ fontSize: "32px", fontWeight: 600, color: p >= 0.8 ? "#5dbf94" : p >= 0.5 ? "#fbbf24" : "#f87171" }}>
                {(p * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: "12px", color: "#7c6fa0", marginTop: "6px" }}>
                抽 {draw} 張，{conds.length > 1 ? "以上條件同時成立" : "條件成立"}的機率
              </div>
              {conds.length > 1 && (
                <div style={{ fontSize: "10px", color: "#4a3f5c", marginTop: "4px" }}>
                  同時符合多個條件的卡只會被算一次
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PRESETS.map(ps => (
                <button key={ps.label}
                  onClick={() => { setDraw(ps.draw); setConds(ps.conds.map(c => ({ ...c }))); }}
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
