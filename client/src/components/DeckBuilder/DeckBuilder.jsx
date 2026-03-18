// src/components/DeckBuilder/DeckBuilder.jsx
import React, { useState, useRef } from "react";
import { cardSets, allTags } from "../cardsConfig";
import { byKey, webpUrlFromKey, parseKey } from "../../utils/imageIndex";
import SearchArea from "./SearchArea";
import CardArea from "./CardArea";
import DeckArea from "./DeckArea";
import ZoomModal from "./ZoomModal";
import WelcomeModal from "./WelcomeModal";
import { sortDeckByType } from "../../utils/sort";
import { API_BASE, saveDeck, importDecklog, loadDeck } from "../../utils/api";
import { Folder } from "lucide-react";


// ✅ 自訂排序規則
const folderRank = (f = "") => {
  if (/^hYS\d+$/i.test(f)) return 100;     // hYS01...
  if (/^hBP\d+$/i.test(f)) return 200;     // hBP01...
  if (/^hSD\d+$/i.test(f)) return 300;     // hSD01...
  if (f === "hPR") return 400;
  if (f === "PC_Set") return 500;
  if (f === "energy") return 600;
  return 999; // 不明的放最後
};


function DeckBuilder() {
  // 狀態管理
  const [zoomImageUrl, setZoomImageUrl] = useState("");
  const [zoomCard, setZoomCard] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(null);

  const [oshiCards, setOshiCards] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [energyCards, setEnergyCards] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("全部");
  const [filterColor, setFilterColor] = useState("全部顏色");
  const [filterGrade, setFilterGrade] = useState("全部階級");
  const [filterSeries, setFilterSeries] = useState("全部彈數");
  const [supportSubtype, setSupportSubtype] = useState("全部");
  const [filterVersion, setFilterVersion] = useState("全部版本");
  const [selectedTag, setSelectedTag] = useState("全部標籤");

  const [shareCode, setShareCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [showWelcome, setShowWelcome] = useState(true);
  const [deckVisible, setDeckVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  

  const deckRef = useRef();
  
  // 組合卡表（從 config）
  const rawCards = cardSets.flat();

  // 去重 (以 imageFolder+id 當 key)
  const uniqueCardMap = new Map();
  rawCards.forEach((card) => {
    const key = `${card.id}-${(card.versions || []).join(",")}`;
    if (!uniqueCardMap.has(key)) {
      uniqueCardMap.set(key, card);
    }
  });
  const allCards = Array.from(uniqueCardMap.values()).map((card) => ({
    ...card,
    sortType: card.grade || card.type,
  }));

  // 從 imageIndex 建立真實卡片清單
  const indexedCards = Object.entries(byKey)
    .map(([key, relPath]) => {
      const [idVer, folder] = key.split("@");
      const match = idVer.match(/^(h[A-Za-z]+[0-9]*-\d{3})(.*)$/);
      if (!match) return null;

      const id = match[1];
      const version = match[2] || "_C";
      const baseCard = allCards.find((c) => c.id === id) || {};

      return {
        id,
        version,
        folder,
        key,
        path: webpUrlFromKey(key),
        ...baseCard,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.folder !== b.folder) return folderRank(a.folder) - folderRank(b.folder);
      if (a.id !== b.id) return a.id.localeCompare(b.id);
      return a.version.localeCompare(b.version);
    });

  // 過濾 + 展開版本
  let filteredCards = indexedCards.filter((card) => {
    const isEnergyCard = card.folder === "energy" || card.type === "Energy";
    const matchType =
      filterType === "全部" ||
      card.type === filterType ||
      (filterType === "Energy" && isEnergyCard);

    const matchSearch =
      card.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.name && card.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.searchKeywords &&
        card.searchKeywords.some((keyword) =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const colorMatch =
      filterColor === "全部顏色" ||
      (Array.isArray(card.color) && card.color.includes(filterColor));
    const gradeMatch = filterGrade === "全部階級" || card.grade === filterGrade;
    const subtypeMatch =
      supportSubtype === "全部" ||
      (Array.isArray(card.searchKeywords) &&
        card.searchKeywords.includes(supportSubtype));
    const tagMatch =
      !selectedTag ||
      selectedTag === "全部標籤" ||
      (Array.isArray(card.tags) && card.tags.includes(selectedTag));

    const seriesMatch =
      filterSeries === "全部彈數" || card.folder === filterSeries;

    const versionMatch =
      filterVersion === "全部版本" || card.version === filterVersion;

    return (
      matchType &&
      matchSearch &&
      colorMatch &&
      gradeMatch &&
      subtypeMatch &&
      tagMatch &&
      seriesMatch &&
      versionMatch
    );
  });

  // ✅ 去重
  const seen = new Set();
  filteredCards = filteredCards.filter((c) => {
    const k = `${c.id}|${c.version}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // ✅ 加入卡片：建立 key
  const handleAddCard = (card, version) => {
    const safeVersion = (version || card.version || "_C").replace(".png", "");
    const key = `${card.id}${safeVersion}@${card.folder}`;
    const newCard = {
      ...card,
      version,
      folder: card.folder,
      key,
    };

    if (card.type === "Oshi") {
      setOshiCards((prev) => [...prev, newCard]);
    } else if (card.type === "Energy") {
      setEnergyCards((prev) => [...prev, newCard]);
    } else {
      setDeckCards((prev) => sortDeckByType([...prev, newCard]));
    }
  };

  // Zoom 控制
  const handleZoom = (url, cardData, index) => {
    setZoomImageUrl(url);
    setZoomCard(cardData);
    setZoomIndex(index);
  };

  const showAdjacentCard = (direction) => {
    if (zoomIndex == null) return;
    const newIndex = zoomIndex + direction;
    if (newIndex >= 0 && newIndex < filteredCards.length) {
      const nextCard = filteredCards[newIndex];
      const imgSrc = nextCard.key ? webpUrlFromKey(nextCard.key) : null;
      setZoomImageUrl(imgSrc || null);
      setZoomCard(nextCard);
      setZoomIndex(newIndex);
    }
  };

  // ✅ 匯出代碼（只傳 key + count）
  const handleExportCode = async () => {
    const groupByCard = (cards) => {
      const map = new Map();
      for (const c of cards) {
        if (!c.key) continue;
        if (!map.has(c.key)) map.set(c.key, { key: c.key, count: 0 });
        map.get(c.key).count++;
      }
      return Array.from(map.values());
    };

    const payload = {
      oshi: groupByCard(oshiCards),
      deck: groupByCard(deckCards),
      energy: groupByCard(energyCards),
    };

    try {
      const { code } = await saveDeck(payload);
      setShareCode(code);
      alert("✅ 代碼已產生：" + code);
      return code;
    } catch (err) {
      alert("❌ 匯出失敗");
      return null;
    }
  };

  // 匯出圖片（同樣用 key+count）
  const handleExportImage = async () => {
    try {
      const groupByCard = (cards) => {
        const map = new Map();
        for (const c of cards) {
          if (!c.key) continue;
          if (!map.has(c.key)) map.set(c.key, { key: c.key, count: 0 });
          map.get(c.key).count++;
        }
        return Array.from(map.values());
      };

      const payload = {
        oshi: groupByCard(oshiCards),
        deck: groupByCard(deckCards),
        energy: groupByCard(energyCards),
      };

      const res = await fetch(`${API_BASE}/export-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("後端匯出失敗");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      console.log("🖼️ Blob URL:", url);

      // 嘗試開新視窗
      const previewWindow = window.open("", "_blank");
      if (!previewWindow) {
        alert("❌ 預覽視窗被瀏覽器阻擋，請允許本站彈出視窗再試一次");
        return;
      }

      // 有成功開視窗才寫入內容
      previewWindow.document.open();
      previewWindow.document.write(`
      <html>
        <head>
          <title>Deck Export</title>
          <style>
            body {
              margin: 0;
              background: #eee;
              display: flex;
              justify-content: center;
              align-items: flex-start; /* 👈 改成從上方開始 */
              min-height: 100vh;
              overflow: auto; /* 👈 出現滾動條 */
            }
            img {
              max-width: 100%;
              height: auto;
              object-fit: contain; /* 👈 確保整張圖縮放 */
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${url}" />
        </body>
      </html>
    `);
      previewWindow.document.close();

    } catch (err) {
      console.error(err);
      alert("❌ 匯出失敗，請檢查 console");
    }
  };

  // ✅ 匯入：後端已保證 key + count
  const handleImportCode = async () => {
    console.log("🚀 handleImportCode triggered with shareCode:", shareCode);
    setLoading(true);
    try {
      let data;
      if (shareCode.length === 5 && !shareCode.includes("-")) {
        // 五碼 → 官方 decklog
        data = await importDecklog(shareCode);
      } else {
        // 六碼 → 自家儲存
        data = await loadDeck(shareCode);
      }

      const attachCardData = (list) =>
        list.flatMap(({ key, id, version, count }) => {
          let matchKey = key;

          // 🔍 Debug 輸出
          console.log("🟡 attachCardData input:", { key, id, version, count });

          // 🔹 如果後端沒有給 key（通常是 decklog）
          if (!matchKey && id && version) {
            const candidate = `${id}${version}`; // hBP02-084_02
            console.log("🔎 嘗試 candidate:", candidate);

            // 先直接找
            matchKey = Object.keys(byKey).find((k) => k.startsWith(candidate));

            // 🔹 如果沒找到，嘗試補 "_U"、"_C"
            if (!matchKey) {
              const tryVersions = [`${version}_U`, `${version}_C`];
              for (const v of tryVersions) {
                const cand = `${id}${v}`;
                matchKey = Object.keys(byKey).find((k) => k.startsWith(cand));
                console.log("✅ 成功補到:", matchKey);
                if (matchKey) break;
              }
            }

            if (!matchKey) {
              console.warn("⚠ 找不到對應 key:", id, version);
              return [];
            }
          }

          const entry = parseKey(matchKey);
          if (!entry) {
            console.warn("⚠ 無效的 key:", matchKey);
            return [];
          }

          const baseCard = allCards.find((c) => c.id === entry.id) || {};
          console.log("🟢 attachCardData 完成:", {
            id: entry.id,
            version: entry.version,
            folder: entry.folder,
            matchKey,
          });

          return Array.from({ length: count || 1 }, () => ({
            ...baseCard,
            id: entry.id,
            version: entry.version,
            folder: entry.folder,
            key: matchKey,
            filename: `${entry.id}${entry.version}.png`,
            path: webpUrlFromKey(matchKey),
          }));
        });

      // ✅ 把 attach 後的結果塞進 state
      setOshiCards(attachCardData(data.oshi || []));
      setDeckCards(attachCardData(data.main || data.deck || []));
      setEnergyCards(attachCardData(data.energy || []));

      alert("✅ 匯入成功");
    } catch (error) {
      alert(`❌ 無法讀取該代碼：${error.message || "不明錯誤"}`);
    } finally {
      setLoading(false);
    }
  };


  // 取出所有 imageFolder
  const allImageFolders = Array.from(
    new Set(
      allCards
        .map((c) => (c.imageFolder || "").replace(/^\//, "").replace(/\/$/, ""))
        .filter(Boolean)
    )
  );


  return (
    <div className="flex flex-col h-screen max-h-screen bg-blue-50">
      {/* 搜尋工具區 */}
      <SearchArea
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterColor={filterColor}
        setFilterColor={setFilterColor}
        filterGrade={filterGrade}
        setFilterGrade={setFilterGrade}
        filterSeries={filterSeries}
        setFilterSeries={setFilterSeries}
        supportSubtype={supportSubtype}
        setSupportSubtype={setSupportSubtype}
        shareCode={shareCode}
        setShareCode={setShareCode}
        filterVersion={filterVersion}
        setFilterVersion={setFilterVersion}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        allTags={allTags}
        loading={loading}
        onExportImage={handleExportImage}
        exporting={exporting}
        onExportCode={handleExportCode}
        onImportCode={handleImportCode}
        onClearDeck={() => {
          if (window.confirm("確定要清空整副牌組嗎？")) {
            setOshiCards([]);
            setDeckCards([]);
            setEnergyCards([]);
            setShareCode("");
          }
        }}
      />

      {/* 卡片清單 & 牌組區 */}
      <div className="flex flex-col md:flex-row flex-1 relative">
        <CardArea
          filteredCards={filteredCards}
          filterSeries={filterSeries}
          filterVersion={filterVersion}
          onAddCard={handleAddCard}
          onZoom={handleZoom}
          allFolders={allImageFolders}
        />

        <DeckArea
          ref={deckRef}
          oshiCards={oshiCards}
          deckCards={deckCards}
          energyCards={energyCards}
          setOshiCards={setOshiCards}
          setDeckCards={setDeckCards}
          setEnergyCards={setEnergyCards}
          filteredCards={filteredCards}
          onZoom={handleZoom}
          deckVisible={deckVisible}
          allFolders={allImageFolders}
        />
      </div>

      {/* Zoom 彈窗 */}
      {zoomCard && (
        <ZoomModal
          card={zoomCard}
          imageUrl={zoomImageUrl}
          onClose={() => {
            setZoomImageUrl("");
            setZoomCard(null);
          }}
          onPrev={() => showAdjacentCard(-1)}
          onNext={() => showAdjacentCard(1)}
        />
      )}

      {/* 歡迎彈窗 */}
      <WelcomeModal show={showWelcome} onClose={() => setShowWelcome(false)} />

      
      {/* 手機專用浮動按鈕 */}
      {!showWelcome && !zoomCard && (
        <button
          onClick={() => setDeckVisible(!deckVisible)}
          className="md:hidden fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white 
                    rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg"
        >
          {deckVisible ? (
            <>
              <span className="text-2xl leading-none">✕</span>
              <span className="text-[11px] mt-0.5">收起</span>
            </>
          ) : (
            <>
              {/* 圖示 */}
              <Folder size={22} className="mb-0.5" />

              {/* 小字 */}
              <span className="text-[10px] leading-tight">我的牌組</span>
            </>
          )}
        </button>
      )}

      {/* 右上角版權 */}
      <div className="absolute top-2 right-4 text-xs text-gray-400 z-50">
        © 2016 COVER Corp.
      </div>
    </div>
  );
}

export default DeckBuilder;
