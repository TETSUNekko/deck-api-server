// SearchBar.jsx
import React, { useState, useRef, useEffect } from "react";

function SearchBar({
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
  exporting,
  onExportCode,
  onImportCode,
  onClearDeck,
  selectedTag,
  setSelectedTag,
  allTags,
  loading
}) {
  
  const [tagSearchInput, setTagSearchInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'main' | 'member' | 'support'
  const [mainDropdownOpen, setMainDropdownOpen] = useState(false);
  const [memberSubOpen, setMemberSubOpen] = useState(false);
  const [supportSubOpen, setSupportSubOpen] = useState(false);

  const dropdownRefs = useRef([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRefs.current.some(ref => ref && ref.contains(e.target))) {
        setActiveDropdown(null);      // 關閉卡片種類選單
        setTagDropdownOpen(false);    // 關閉標籤選單
        setMainDropdownOpen(false);
        setMemberSubOpen(false);
        setSupportSubOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div className="sticky top-0 z-40 bg-amber-50 p-3 border-b border-yellow-300 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 overflow-x-visible relative z-10">
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
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded max-w-[150px] w-full text-sm truncate"
        >
          🔄 清空搜尋
        </button>

        <div className="relative" ref={el => dropdownRefs.current[0] = el}>  
          <button
            onClick={() => {
              setMainDropdownOpen(!mainDropdownOpen);
              setMemberSubOpen(false);
              setSupportSubOpen(false);
            }}
            className="border rounded px-2 py-1 bg-white max-w-[160px] w-full text-sm truncate"
          >
            {typeDisplayName[filterType] || "卡片種類"}{extraLabel} ▾
          </button>

          {mainDropdownOpen && (
            <div className="absolute bg-white border rounded shadow z-10 w-32 mt-1">
              <div
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  setFilterType("全部");
                  setFilterGrade("全部階級");
                  setSupportSubtype("全部");
                  setMainDropdownOpen(false);
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
                  setMainDropdownOpen(false);
                }}
              >
                主推卡
              </div>

              {/* 成員卡（有子選單） */}
              <div className="relative">
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setMemberSubOpen(!memberSubOpen);
                    setSupportSubOpen(false);
                  }}
                >
                  成員卡 ▸
                </div>
                {memberSubOpen && (
                  <div className="absolute left-full top-0 bg-white border rounded shadow w-40 z-30">
                    {["全部階級", "debut", "1st", "2nd", "buzz", "spot"].map((grade) => (
                      <div
                        key={grade}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFilterType("Member");
                          setFilterGrade(grade);
                          setSupportSubtype("全部");
                          setMainDropdownOpen(false);
                          setMemberSubOpen(false);
                        }}
                      >
                        {grade}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 支援卡（有子選單） */}
              <div className="relative">
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSupportSubOpen(!supportSubOpen);
                    setMemberSubOpen(false);
                  }}
                >
                  支援卡 ▸
                </div>
                {supportSubOpen && (
                  <div className="absolute left-full top-0 bg-white border rounded shadow w-40 z-30">
                    {["全部", "item", "event", "tool", "mascot", "fan", "staff"].map((subtype) => (
                      <div
                        key={subtype}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFilterType("Support");
                          setSupportSubtype(subtype);
                          setFilterGrade("全部階級");
                          setMainDropdownOpen(false);
                          setSupportSubOpen(false);
                        }}
                      >
                        {subtype}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setFilterType("Energy");
                  setFilterGrade("全部階級");
                  setSupportSubtype("全部");
                  setMainDropdownOpen(false);
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
          className="border rounded px-2 py-1 bg-white max-w-[150px] w-full text-sm truncate"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select className="border rounded px-2 py-1 max-w-[150px] w-full text-sm truncate" value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
          <option value="全部顏色">全部顏色</option>
          <option value="red">紅</option>
          <option value="white">白</option>
          <option value="blue">藍</option>
          <option value="green">綠</option>
          <option value="yellow">黃</option>
          <option value="purple">紫</option>
          <option value="colorless">無</option>
        </select>

        <select className="border rounded px-2 py-1 max-w-[200px] w-full text-sm truncate" value={filterSeries} onChange={(e) => setFilterSeries(e.target.value)}>
          <option value="全部彈數">全部彈數</option>
          <option value="hYS01">hYS01 エントリーカップ「ブルーミングレディアンス」スタートエールセット</option>
          <option value="hBP01">hBP01 ブースターパック「ブルーミングレディアンス」</option>
          <option value="hBP02">hBP02 ブースターパック「クインテットスペクトラム」</option>
          <option value="hBP03">hBP03 ブースターパック「エリートスパーク」</option>
          <option value="hBP04">hBP04 ブースターパック「キュリアスユニバース」</option>
          <option value="hBP05">hBP05 ブースターパック「エンチャントレガリア」</option>
          <option value="hBP06">hBP06 ブースターパック「アヤカシヴァーミリオン」</option>
          <option value="hBP07">hBP07 ブースターパック「ディーヴァフィーバー」</option>
          <option value="hSD01">hSD01 スタートデッキ「ときのそら＆AZKi」</option>
          <option value="hSD02">hSD02 スタートデッキ 赤 百鬼あやめ</option>
          <option value="hSD03">hSD03 スタートデッキ 青 猫又おかゆ</option>
          <option value="hSD04">hSD04 スタートデッキ 紫 癒月ちょこ</option>
          <option value="hSD05">hSD05 スタートデッキ 白 轟はじめ</option>
          <option value="hSD06">hSD06 スタートデッキ 緑 風真いろは</option>
          <option value="hSD07">hSD07 スタートデッキ 黄 不知火フレア</option>
          <option value="hSD08">hSD08 スタートデッキ 白 天音かなた</option>
          <option value="hSD09">hSD09 スタートデッキ 赤 宝鐘マリン</option>
          <option value="hSD10">hSD10 スタートデッキ FLOW GLOW 推し 輪堂千速</option>
          <option value="hSD11">hSD11 スタートデッキ FLOW GLOW 推し 虎金妃笑虎</option>
          <option value="hSD12">hSD12 スタートデッキ 推し Advent</option>
          <option value="hSD13">hSD13 スタートデッキ 推し Justice</option>
          <option value="hPR">PRカード</option>
          <option value="hBD24">生日カード</option>
        　<option value="energy">エールカード</option>
          <option value="PC_Set">【イベント物販／hololive production OFFICIAL SHOP限定商品】オフィシャルホロカコレクション-PCセット-</option>
        </select>

        <div className="relative" ref={el => dropdownRefs.current[1] = el}>  
          <button
            onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            className="border rounded px-2 py-1 bg-white min-w-[150px] max-w-[200px] text-left truncate"
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
          className="border rounded px-2 py-1 max-w-[150px] w-full text-sm truncate"
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
          <option value="_HR">HR</option>
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
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-2"
        >
          {exporting ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <>🖼 匯出圖片</>
          )}
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

      <div className="mt-2 text-right text-[12px] text-gray-500 pr-1">
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
