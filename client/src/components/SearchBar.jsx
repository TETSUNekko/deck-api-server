// SearchBar.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

// ── 共用樣式常數 ──────────────────────────────────────────
const CHIP = {
  display: "inline-flex", alignItems: "center", gap: "5px",
  padding: "5px 14px", borderRadius: "20px",
  border: "1px solid #3d3155", background: "#2a2240",
  color: "#c9b8e0", fontSize: "13px", cursor: "pointer",
  whiteSpace: "nowrap", flexShrink: 0, userSelect: "none",
};
const CHIP_ON = { ...CHIP, border: "1px solid #c084fc", background: "#3d2d55", color: "#e9d5ff" };
const BTN = {
  fontSize: "13px", padding: "6px 16px", borderRadius: "20px",
  border: "1px solid", cursor: "pointer", fontWeight: 500,
  whiteSpace: "nowrap", fontFamily: "inherit", lineHeight: 1.4,
};

// ── Portal Dropdown ────────────────────────────────────────
// 把 dropdown 掛到 document.body，完全脫離 sticky stacking context
function PortalDropdown({ anchorRef, open, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
  }, [open, anchorRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div style={{
      position: "absolute", top: pos.top, left: pos.left,
      background: "#1e1830", border: "1px solid #3d3155",
      borderRadius: "12px", zIndex: 99999,
      minWidth: "140px", boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
      overflow: "hidden",
    }}>
      {children}
    </div>,
    document.body
  );
}

// ── Dropdown Item ──────────────────────────────────────────
function DItem({ onClick, children, active }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "8px 16px", fontSize: "13px", cursor: "pointer",
        color: active ? "#e9d5ff" : "#c9b8e0",
        background: active ? "#3d2d55" : hover ? "#2a2240" : "transparent",
      }}
    >
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
function SearchBar({
  filterType, setFilterType,
  searchTerm, setSearchTerm,
  filterColor, setFilterColor,
  filterGrade, setFilterGrade,
  filterSeries, setFilterSeries,
  supportSubtype, setSupportSubtype,
  filterVersion, setFilterVersion,
  shareCode, setShareCode,
  onExportImage, exporting,
  onExportCode, onImportCode, onClearDeck,
  selectedTag, setSelectedTag, allTags,
  loading,
}) {
  const [open, setOpen] = useState(null); // 目前展開的 dropdown 名稱
  const [memberSub, setMemberSub] = useState(false);
  const [supportSub, setSupportSub] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  // 每個 chip 的 ref（用來定位 portal）
  const refs = {
    type: useRef(null),
    color: useRef(null),
    series: useRef(null),
    tag: useRef(null),
    version: useRef(null),
    member: useRef(null),
    support: useRef(null),
  };

  const toggle = (name) => {
    setOpen((p) => (p === name ? null : name));
    setMemberSub(false);
    setSupportSub(false);
  };

  const close = useCallback(() => {
    setOpen(null);
    setMemberSub(false);
    setSupportSub(false);
  }, []);

  // 點外面關閉
  useEffect(() => {
    const handler = (e) => {
      const clickedChip = Object.values(refs).some(r => r.current?.contains(e.target));
      // portal 的 dropdown 內容直接在 body 下，只排除 chip 本身
      if (!clickedChip) {
        const dropdowns = document.querySelectorAll("[data-searchbar-dropdown]");
        const clickedDropdown = Array.from(dropdowns).some(d => d.contains(e.target));
        if (!clickedDropdown) close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close]);

  const handleCopyCode = async () => {
    const data = await onExportCode();
    if (data) {
      navigator.clipboard.writeText(data)
        .then(() => alert(`📋 已複製代碼 ${data} 到剪貼簿！`))
        .catch(() => alert("❌ 無法複製代碼"));
    }
  };

  const clearAll = () => {
    setSearchTerm(""); setFilterType("全部"); setFilterColor("全部顏色");
    setFilterGrade("全部階級"); setFilterSeries("全部彈數");
    setSupportSubtype("全部"); setFilterVersion("全部版本");
    setSelectedTag("全部標籤"); setTagSearch("");
  };

  // Labels
  const typeMap = { "全部": "卡片種類", Oshi: "主推卡", Member: "成員卡", Support: "支援卡", Energy: "能量卡" };
  const extraLabel =
    filterType === "Member" && filterGrade !== "全部階級" ? ` · ${filterGrade}` :
    filterType === "Support" && supportSubtype !== "全部" ? ` · ${supportSubtype}` : "";
  const colorMap = { "全部顏色": "顏色", red: "紅", white: "白", blue: "藍", green: "綠", yellow: "黃", purple: "紫", colorless: "無色" };
  const seriesLabel = filterSeries === "全部彈數" ? "彈數" : filterSeries;
  const versionLabel = filterVersion === "全部版本" ? "版本" : filterVersion.replace("_", "");
  const tagLabel = (!selectedTag || selectedTag === "全部標籤") ? "標籤" : `#${selectedTag}`;

  const seriesList = [
    "全部彈數","hYS01","hBP01","hBP02","hBP03","hBP04","hBP05","hBP06","hBP07",
    "hSD01","hSD02","hSD03","hSD04","hSD05","hSD06","hSD07","hSD08","hSD09",
    "hSD10","hSD11","hSD12","hSD13","hPR","hBD24","energy","PC_Set",
  ];
  const versionList = ["全部版本","_C","_U","_S","_R","_RR","_SR","_UR","_HR","_OC","_OSR","_OUR","_SEC","_P","_SY"];

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40 }}>

      {/* Row 1 — 篩選列 */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 16px", background: "#1e1830",
        borderBottom: "1px solid #2d2440",
        overflowX: "auto", msOverflowStyle: "none", scrollbarWidth: "none",
      }}>

        {/* 搜尋框 */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "#2a2240", border: "1px solid #3d3155",
          borderRadius: "20px", padding: "5px 12px", flexShrink: 0,
        }}>
          <span style={{ fontSize: "13px", color: "#4a3f5c" }}>🔍</span>
          <input
            type="text" placeholder="搜尋卡號或名稱..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "none", border: "none", outline: "none",
              fontSize: "13px", color: "#c9b8e0", width: "130px", fontFamily: "inherit",
            }}
          />
        </div>

        {/* 卡片種類 */}
        <div ref={refs.type} style={{ flexShrink: 0 }}>
          <div style={filterType !== "全部" ? CHIP_ON : CHIP} onClick={() => toggle("type")}>
            {typeMap[filterType]}{extraLabel} <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
          </div>
          <PortalDropdown anchorRef={refs.type} open={open === "type"}>
            <div data-searchbar-dropdown>
              <DItem onClick={() => { setFilterType("全部"); setFilterGrade("全部階級"); setSupportSubtype("全部"); close(); }} active={filterType === "全部"}>全部卡片</DItem>
              <DItem onClick={() => { setFilterType("Oshi"); setFilterGrade("全部階級"); setSupportSubtype("全部"); close(); }} active={filterType === "Oshi"}>主推卡</DItem>

              {/* 成員卡 */}
              <div ref={refs.member} style={{ position: "relative" }}>
                <DItem onClick={() => { setMemberSub(p => !p); setSupportSub(false); }} active={filterType === "Member"}>
                  <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>成員卡 <span>▸</span></span>
                </DItem>
                <PortalDropdown anchorRef={refs.member} open={memberSub}>
                  <div data-searchbar-dropdown>
                    {["全部階級","debut","1st","2nd","buzz","spot"].map(g => (
                      <DItem key={g} onClick={() => { setFilterType("Member"); setFilterGrade(g); setSupportSubtype("全部"); close(); }} active={filterType === "Member" && filterGrade === g}>{g}</DItem>
                    ))}
                  </div>
                </PortalDropdown>
              </div>

              {/* 支援卡 */}
              <div ref={refs.support} style={{ position: "relative" }}>
                <DItem onClick={() => { setSupportSub(p => !p); setMemberSub(false); }} active={filterType === "Support"}>
                  <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>支援卡 <span>▸</span></span>
                </DItem>
                <PortalDropdown anchorRef={refs.support} open={supportSub}>
                  <div data-searchbar-dropdown>
                    {["全部","item","event","tool","mascot","fan","staff"].map(s => (
                      <DItem key={s} onClick={() => { setFilterType("Support"); setSupportSubtype(s); setFilterGrade("全部階級"); close(); }} active={filterType === "Support" && supportSubtype === s}>{s}</DItem>
                    ))}
                  </div>
                </PortalDropdown>
              </div>

              <DItem onClick={() => { setFilterType("Energy"); setFilterGrade("全部階級"); setSupportSubtype("全部"); close(); }} active={filterType === "Energy"}>能量卡</DItem>
            </div>
          </PortalDropdown>
        </div>

        {/* 顏色 */}
        <div ref={refs.color} style={{ flexShrink: 0 }}>
          <div style={filterColor !== "全部顏色" ? CHIP_ON : CHIP} onClick={() => toggle("color")}>
            {colorMap[filterColor] || filterColor} <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
          </div>
          <PortalDropdown anchorRef={refs.color} open={open === "color"}>
            <div data-searchbar-dropdown>
              {[["全部顏色","全部顏色"],["red","紅"],["white","白"],["blue","藍"],["green","綠"],["yellow","黃"],["purple","紫"],["colorless","無色"]].map(([v,l]) => (
                <DItem key={v} onClick={() => { setFilterColor(v); close(); }} active={filterColor === v}>{l}</DItem>
              ))}
            </div>
          </PortalDropdown>
        </div>

        {/* 彈數 */}
        <div ref={refs.series} style={{ flexShrink: 0 }}>
          <div style={filterSeries !== "全部彈數" ? CHIP_ON : CHIP} onClick={() => toggle("series")}>
            {seriesLabel} <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
          </div>
          <PortalDropdown anchorRef={refs.series} open={open === "series"}>
            <div data-searchbar-dropdown style={{ maxHeight: "260px", overflowY: "auto" }}>
              {seriesList.map(v => (
                <DItem key={v} onClick={() => { setFilterSeries(v); close(); }} active={filterSeries === v}>{v === "全部彈數" ? "全部彈數" : v}</DItem>
              ))}
            </div>
          </PortalDropdown>
        </div>

        {/* 標籤 */}
        <div ref={refs.tag} style={{ flexShrink: 0 }}>
          <div style={selectedTag && selectedTag !== "全部標籤" ? CHIP_ON : CHIP} onClick={() => toggle("tag")}>
            {tagLabel} <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
          </div>
          <PortalDropdown anchorRef={refs.tag} open={open === "tag"}>
            <div data-searchbar-dropdown style={{ width: "180px", maxHeight: "260px", overflowY: "auto" }}>
              <div style={{ padding: "8px 10px", borderBottom: "1px solid #2d2440", position: "sticky", top: 0, background: "#1e1830" }}>
                <input
                  type="text" value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                  placeholder="搜尋標籤..."
                  style={{
                    width: "100%", background: "#2a2240", border: "1px solid #3d3155",
                    borderRadius: "8px", padding: "4px 10px", fontSize: "13px",
                    color: "#c9b8e0", outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>
              <DItem onClick={() => { setSelectedTag("全部標籤"); close(); setTagSearch(""); }} active={!selectedTag || selectedTag === "全部標籤"}>#全部標籤</DItem>
              {allTags.filter(t => t.includes(tagSearch)).map(tag => (
                <DItem key={tag} onClick={() => { setSelectedTag(tag); close(); setTagSearch(""); }} active={selectedTag === tag}>#{tag}</DItem>
              ))}
            </div>
          </PortalDropdown>
        </div>

        {/* 版本 */}
        <div ref={refs.version} style={{ flexShrink: 0 }}>
          <div style={filterVersion !== "全部版本" ? CHIP_ON : CHIP} onClick={() => toggle("version")}>
            {versionLabel} <span style={{ fontSize: "10px", opacity: 0.6 }}>▾</span>
          </div>
          <PortalDropdown anchorRef={refs.version} open={open === "version"}>
            <div data-searchbar-dropdown style={{ maxHeight: "260px", overflowY: "auto" }}>
              {versionList.map(v => (
                <DItem key={v} onClick={() => { setFilterVersion(v); close(); }} active={filterVersion === v}>{v === "全部版本" ? "全部版本" : v.replace("_", "")}</DItem>
              ))}
            </div>
          </PortalDropdown>
        </div>

        {/* 分隔 */}
        <div style={{ width: "1px", height: "18px", background: "#2d2440", flexShrink: 0, margin: "0 2px" }} />

        {/* 清空篩選 */}
        <div
          style={{ ...CHIP, border: "1px solid transparent", background: "transparent", color: "#c9b8e0" }}
          onMouseEnter={e => e.currentTarget.style.color = "#9b8ab0"}
          onMouseLeave={e => e.currentTarget.style.color = "#c9b8e0"}
          onClick={clearAll}
        >
          清空篩選
        </div>
      </div>

      {/* Row 2 — 操作列 */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "7px 16px", background: "#1a1625",
        borderBottom: "1px solid #2d2440",
      }}>
        <button style={{ ...BTN, borderColor: "#3d3155", color: "#9b8ab0", background: "#2a2240" }} onClick={onClearDeck}>🧹 清空牌組</button>
        <button style={{ ...BTN, borderColor: "#2d6e50", color: "#5dbf94", background: "#1a3028" }} onClick={onExportImage}>
          {exporting ? "匯出中..." : "🖼 匯出圖片"}
        </button>
        <button style={{ ...BTN, borderColor: "#1e4a7a", color: "#5ba3e0", background: "#162033" }} onClick={handleCopyCode}>🔗 分享代碼</button>
        <input
          type="text" placeholder="輸入代碼..."
          value={shareCode} onChange={e => setShareCode(e.target.value)}
          style={{
            fontSize: "13px", padding: "6px 12px", borderRadius: "20px",
            border: "1px solid #3d3155", background: "#2a2240",
            color: "#c9b8e0", width: "110px", outline: "none", fontFamily: "inherit",
          }}
        />
        <button style={{ ...BTN, borderColor: "#6b3fa0", color: "#c084fc", background: "#2d1e40" }} onClick={onImportCode}>
          {loading ? "讀取中..." : "📥 讀取代碼"}
        </button>
        <div style={{ flex: 1 }} />
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=holotcgtw.feedback@gmail.com&su=HoloTCG意見回饋&body=請在此填寫你的意見～"
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#c9b8e0", textDecoration: "underline" }}>意見回饋</a>
        <span style={{ fontSize: "12px", color: "#3d3155" }}>｜</span>
        <a href="https://www.facebook.com/HoONeko"
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "12px", color: "#c9b8e0", textDecoration: "underline" }}>翻譯圖：鳳凰貓</a>
      </div>
    </div>
  );
}

export default SearchBar;