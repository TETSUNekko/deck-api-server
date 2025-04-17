// SearchBar.jsx
import React, { useState, useRef, useEffect } from "react";

function SearchBar({
  playerName,
  filterType,
  setFilterType,
  searchTerm,
  setSearchTerm,
  filterColor,
  setFilterColor,
  filterGrade,
  setFilterGrade,
  filterSeries,
  setFilterSeries,
  supportSubtype,
  setSupportSubtype,
  filterVersion,
  setFilterVersion,
  shareCode,
  setShareCode,
  onExportImage,
  onExportCode,
  onImportCode,
  onClearDeck,
  selectedTag,
  setSelectedTag,
  allTags,
  loading
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagInputRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagInputRef.current && !tagInputRef.current.contains(event.target)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyCode = async () => {
    const data = await onExportCode();
    if (data) {
      navigator.clipboard.writeText(data).then(() => {
        alert(`📋 已複製代碼 ${data} 到剪貼簿！`);
      }).catch(() => {
        alert("❌ 無法複製代碼");
      });
    }
  };

  const typeDisplayName = {
    "全部": "卡片種類",
    "Oshi": "主推卡",
    "Member": "成員卡",
    "Support": "支援卡",
    "Energy": "能量卡"
  };
  const extraLabel =
    filterType === "Member" && filterGrade !== "全部階級"
      ? ` - ${filterGrade}`
      : filterType === "Support" && supportSubtype !== "全部"
      ? ` - ${supportSubtype}`
      : "";

  return (
    <div className="sticky top-0 z-10 bg-amber-50 p-3 border-b border-yellow-300 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 overflow-visible">
        <button
          onClick={() => {
            setSearchTerm("");
            setFilterType("全部");
            setFilterColor("全部顏色");
            setFilterGrade("全部階級");
            setFilterSeries("全部彈數");
            setSupportSubtype("全部");
            setFilterVersion("全部版本");
            setSelectedTag("全部標籤");
            setTagSearchInput("");
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          🔄 清空搜尋
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="border rounded px-2 py-1 bg-white"
          >
            {typeDisplayName[filterType] || "卡片種類"}{extraLabel} ▾
          </button>

          {showDropdown && (
            <div className="absolute bg-white border rounded shadow z-10 w-32 mt-1">
              <div
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  setFilterType("全部");
                  setFilterGrade("全部階級");
                  setSupportSubtype("全部");
                  setShowDropdown(false);
                }}
              >
                全部卡片
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setFilterType("Oshi");
                  setFilterGrade("全部階級");
                  setSupportSubtype("全部");
                  setShowDropdown(false);
                }}
              >
                主推卡
              </div>
              <div className="group relative">
                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">成員卡 ▸</div>
                <div className="absolute left-full top-0 bg-white border rounded shadow hidden group-hover:block w-28">
                  {["全部階級", "debut", "1st", "2nd", "buzz", "spot"].map((grade) => (
                    <div
                      key={grade}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFilterType("Member");
                        setFilterGrade(grade);
                        setSupportSubtype("全部");
                        setShowDropdown(false);
                      }}
                    >
                      {grade}
                    </div>
                  ))}
                </div>
              </div>
              <div className="group relative">
                <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer">支援卡 ▸</div>
                <div className="absolute left-full top-0 bg-white border rounded shadow hidden group-hover:block w-28">
                  {["全部", "item", "event", "tool", "mascot", "fan", "staff"].map((subtype) => (
                    <div
                      key={subtype}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFilterType("Support");
                        setSupportSubtype(subtype);
                        setFilterGrade("全部階級");
                        setShowDropdown(false);
                      }}
                    >
                      {subtype}
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setFilterType("Energy");
                  setFilterGrade("全部階級");
                  setSupportSubtype("全部");
                  setShowDropdown(false);
                }}
              >
                能量卡
              </div>
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="搜尋卡片編號或名稱..."
          className="border px-2 py-1 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select className="border rounded px-2 py-1" value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
          <option value="全部顏色">全部顏色</option>
          <option value="red">紅</option>
          <option value="white">白</option>
          <option value="blue">藍</option>
          <option value="green">綠</option>
          <option value="yellow">黃</option>
          <option value="purple">紫</option>
          <option value="colorless">無</option>
        </select>

        <select className="border rounded px-2 py-1" value={filterSeries} onChange={(e) => setFilterSeries(e.target.value)}>
          <option value="全部彈數">全部彈數</option>
          <option value="hBP01">hBP01ブースターパック「ブルーミングレディアンス」</option>
          <option value="hBP02">hBP02ブースターパック「クインテットスペクトラム」</option>
          <option value="hBP03">hBP03ブースターパック「エリートスパーク」</option>
          <option value="hSD01">hSD01スタートデッキ「ときのそら＆AZKi」</option>
          <option value="hSD02">hSD02スタートデッキ 赤 百鬼あやめ</option>
          <option value="hSD03">hSD03スタートデッキ 青 猫又おかゆ</option>
          <option value="hSD04">hSD04スタートデッキ 紫 癒月ちょこ</option>
          <option value="hSD05">hSD05スタートデッキ 白 轟はじめ</option>
          <option value="hSD06">hSD06スタートデッキ 緑 風真いろは</option>
          <option value="hSD07">hSD07スタートデッキ 黄 不知火フレア</option>
          <option value="hPR">PRカード</option>
        </select>

        <div className="relative" ref={tagInputRef}>
          <button
            onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            className="border rounded px-2 py-1 bg-white min-w-[180px] text-left"
          >
            {selectedTag ? `#${selectedTag}` : "搜尋卡片標籤..."} ▾
          </button>

          {tagDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-y-auto">
              <input
                type="text"
                value={tagSearchInput}
                onChange={(e) => setTagSearchInput(e.target.value)}
                className="w-full px-2 py-1 border-b"
                placeholder="輸入標籤名稱..."
              />

              {/* ➕ 固定的「全部標籤」選項 */}
              <div
                onClick={() => {
                  setSelectedTag("全部標籤");
                  setTagDropdownOpen(false);
                  setTagSearchInput("");
                }}
                className="px-4 py-1 hover:bg-gray-100 cursor-pointer font-semibold text-gray-600"
              >
                #全部標籤
              </div>

              {/* 🔍 篩選後的標籤列表 */}
              {allTags
                .filter((tag) => tag.includes(tagSearchInput))
                .map((tag) => (
                  <div
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setTagDropdownOpen(false);
                      setTagSearchInput("");
                    }}
                    className="px-4 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    #{tag}
                  </div>
              ))}
            </div>
          )}
        </div>

        <select
          className="border rounded px-2 py-1"
          value={filterVersion}
          onChange={(e) => setFilterVersion(e.target.value)}
        >
          <option value="全部版本">全部版本</option>
          <option value="_C">C</option>
          <option value="_U">U</option>
          <option value="_S">S</option>
          <option value="_R">R</option>
          <option value="_RR">RR</option>
          <option value="_SR">SR</option>
          <option value="_UR">UR</option>
          <option value="_OC">OC</option>
          <option value="_OSR">OSR</option>
          <option value="_OUR">OUR</option>
          <option value="_SEC">SEC</option>
          <option value="_P">P</option>
          <option value="_SY">SY</option>
        </select>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button 
          onClick={onClearDeck}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          🧹 清空牌組
        </button>
        <button 
          onClick={onExportImage}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
        >
          📊 輸出圖表
        </button>
        <button 
          onClick={handleCopyCode}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
        >
          🔗 分享代碼
        </button>
        <input
          type="text"
          placeholder="輸入代碼..."
          className="border px-2 py-1 rounded"
          value={shareCode}
          onChange={(e) => setShareCode(e.target.value)}
        />
        <button
          onClick={onImportCode}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded flex items-center gap-2"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <>📥 讀取代碼</>
          )}
        </button>

        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=holotcgtw.feedback@gmail.com&su=HoloTCG意見回饋&body=請在此填寫你的意見～"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          📮 意見回饋
        </a>
      </div>

      <div className="mt text-right text-[12px] text-gray-500 pr-1">
        翻譯圖來源：<a
          href="https://www.facebook.com/HoONeko"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-500"
        >
          鳳凰貓 Bushiroad Card Gamer 
        </a>
      </div>
    </div>
  );
}

export default SearchBar;
