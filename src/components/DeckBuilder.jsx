// DeckBuilder.jsx
import React, { useState, useRef } from "react";
import cardList from "../cardList_hBP01.json";
import cardListBP02 from "../cardList_hBP02.json";
import cardListBP03 from "../cardList_hBP03.json";
import energyCardList from "../cardList_hY.json";
import { ZoomIn } from "lucide-react";
import SearchBar from "./SearchBar";
import html2canvas from "html2canvas";

const CardImage = ({ card, version, className, style, onZoom, onClick }) => {
  const basePath = import.meta.env.BASE_URL || "/";
  const imgSrc = `${basePath}webpcards/${card.imageFolder}${card.id}${version.replace(".png", ".webp")}`;

  return (
    <div className={`relative ${className}`} onClick={onClick} style={style}>
      <img
        src={imgSrc}
        alt={card.id}
        loading="lazy"
        className="w-full h-full object-contain"
      />
      <button
        className="absolute top-0 left-0 p-0.5 text-white bg-black bg-opacity-50 hover:bg-opacity-80 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onZoom(imgSrc, card);
        }}
      >
        <ZoomIn size={10} />
      </button>
    </div>
  );
};

function DeckBuilder({ playerName }) {
  const [zoomImageUrl, setZoomImageUrl] = useState("");
  const [zoomCard, setZoomCard] = useState(null);
  const [oshiCards, setOshiCards] = useState([]);
  const [deckCards, setDeckCards] = useState([]);
  const [energyCards, setEnergyCards] = useState([]);
  const [shareCode, setShareCode] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("全部");
  const [filterColor, setFilterColor] = useState("全部顏色");
  const [filterGrade, setFilterGrade] = useState("全部階級");
  const [filterSeries, setFilterSeries] = useState("全部彈數");
  const [supportSubtype, setSupportSubtype] = useState("全部");
  const [filterVersion, setFilterVersion] = useState("全部版本");

  const deckRef = useRef();
  const allCards = [...cardList, ...cardListBP02, ...cardListBP03, ...energyCardList];

  const filteredCards = allCards.filter((card) => {
    const isEnergyCard = card.imageFolder.includes("energy") || card.type === "Energy";
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

    const colorMatch = filterColor === "全部顏色" || card.color.includes(filterColor);
    const gradeMatch = filterGrade === "全部階級" || card.grade === filterGrade;
    const seriesMatch = filterSeries === "全部彈數" || card.series === filterSeries;
    const subtypeMatch =
      supportSubtype === "全部" ||
      (card.searchKeywords && card.searchKeywords.includes(supportSubtype));

    return matchType && matchSearch && colorMatch && gradeMatch && seriesMatch && subtypeMatch;
  });

  const handleAddCard = (card, version) => {
    if (filterVersion !== "全部版本" && version.replace(".png", "") !== filterVersion) return;

    if (card.type === "Oshi") {
      setOshiCards((prev) => [...prev, { ...card, version }]);
    }else if (card.type === "Energy") {
      setEnergyCards((prev) => [...prev, { ...card, version }]);
    } else {
      setDeckCards((prev) => [...prev, { ...card, version }]);
    }
  };

  const handleRemoveDeckCard = (index) => {
    setDeckCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveEnergyCard = (index) => {
    setEnergyCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExportCode = async () => {
    const payload = {
      oshi: oshiCards,
      deck: deckCards,
      energy: energyCards
    };
    const code = Array.from({ length: 6 }, () =>
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))
    ).join("");

    try {
      await fetch("https://deck-api-server.onrender.com/save", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, payload })
      });
      setShareCode(code);
      return code;
    } catch (e) {
      alert("❌ 無法儲存代碼");
      return null;
    }
  };

  const handleImportCode = async () => {
    try {
      const res = await fetch(`https://deck-api-server.onrender.com/load/${shareCode}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOshiCards(data.oshi || []);
      setDeckCards(data.deck);
      setEnergyCards(data.energy);
      alert("✅ 成功讀取代碼");
    } catch {
      alert("❌ 無法讀取該代碼");
    }
  };

  const handleExportImage = () => {
    const grouped = {};
    [...oshiCards, ...deckCards, ...energyCards].forEach((card) => {
      const key = `${card.id}${card.version}`;
      grouped[key] = grouped[key] || { ...card, count: 0 };
      grouped[key].count += 1;
    });
  
    const html = `<!DOCTYPE html><html><head><title>我的牌組</title>
      <style>
        body { font-family: sans-serif; padding: 20px; background:rgb(206, 240, 239); }
        h1 { margin-bottom: 12px; }
        .grid { display: flex; flex-wrap: wrap; gap: 10px; cursor: pointer; }
        .card { position: relative; width: 140px; height: 210px; }
        .card img { width: 100%; height: 100%; object-fit: contain; }
        .count {
          position: absolute;
          bottom: 2px;
          right: 4px;
          background: #000000aa;
          color: #fff;
          font-weight: bold;
          font-size: 18px;
          padding: 4px 8px;
          border-radius: 4px;
        }
      </style>
    </head><body>
      <h1>我的牌組(點圖片可下載)</h1>
      <div class="grid" id="deckArea" title="點擊下載圖片">
        ${Object.values(grouped).map((c) => `
          <div class="card">
            <img src="cards/${c.imageFolder}${c.id}${c.version}" alt="${c.id}" />
            <div class="count">${c.count}</div>
          </div>
        `).join("")}
      </div>
  
      <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
      <script>
        const deckArea = document.getElementById('deckArea');
        deckArea.addEventListener('click', () => {
          html2canvas(deckArea, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'my-deck.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          });
        });
      </script>
    </body></html>`;
  
    const w = window.open();
    w.document.write(html);
    w.document.close();
  };
  

  const renderZoomCard = () => {
    if (!zoomImageUrl || !zoomCard) return null;
  
    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center"
        onClick={() => {
          setZoomImageUrl("");
          setZoomCard(null);
        }}
      >
        <img
          src={zoomImageUrl}
          alt={zoomCard.id}
          style={{ width: "420px", height: "630px" }}
          className="shadow-xl"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-blue-50">
      <SearchBar
        playerName={playerName}
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
        onExportImage={handleExportImage}
        onExportCode={handleExportCode}
        onImportCode={handleImportCode}
        />
        
        {/* 左側卡片清單容器 */}
        <div className="flex flex-1">

          <div className="w-1/2 h-full">
            <div className="overflow-y-auto px-2 pt-6 pb-2" style={{ maxHeight: "calc(100vh - 160px)" }}>
              <div className="grid grid-cols-5 gap-1">
          
              {filteredCards.flatMap((card) =>
                (card.versions || ["_C.png"])
                  .filter((version) => {
                    if (filterVersion === "全部版本") return true;
                    return version.replace(".png", "") === filterVersion;
                  })
                  .map((version) => (
                    <div
                      key={`${card.id}-${version}`}
                      className="relative cursor-pointer"
                      onClick={() => handleAddCard(card, version)}
                    >
                      <CardImage
                        card={card}
                        version={version}
                        style={{ width: "140px", height: "210px" }}
                        onZoom={(url, cardData) => {
                          setZoomImageUrl(url);
                          setZoomCard(cardData);
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] text-center truncate">
                        {card.id} {version.replace(".png", "")}
                      </div>
                    </div>
                  ))
              )}
              </div>
            </div>
          </div>
  
          <div className="w-1/2 border-l px-4 py-4 bg-zinc-100" ref={deckRef}>
            <h3 className="text-lg font-bold mb-2">🗂 我的牌組</h3>
  
            <div className="mb-4">
              <h4 className="text-sm font-semibold">🌟 主推卡（{oshiCards.length} / 1）：</h4>
                {oshiCards.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {oshiCards.map((card, index) => (
                      <CardImage
                        key={`${card.id}-oshi-${index}`}
                        card={card}
                        version={card.version}
                        style={{ width: "63px", height: "88px" }}
                        onZoom={(url, cardData) => {
                          setZoomImageUrl(url);
                          setZoomCard(cardData);
                        }}
                        onClick={() =>
                          setOshiCards((prev) => prev.filter((_, i) => i !== index))
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">尚未選擇主推卡</p>
                )}
            </div>
  
            <div className="mb-4">
              <h4 className="text-sm font-semibold">📦 主卡組 ({deckCards.length} / 50)：</h4>
              <div className="flex flex-wrap gap-1">
                {deckCards.map((card, index) => (
                  <CardImage
                    key={`${card.id}-${card.version}-${index}`}
                    card={card}
                    version={card.version}
                    style={{ width: "63px", height: "88px" }}
                    onZoom={(url, cardData) => {
                      setZoomImageUrl(url);
                      setZoomCard(cardData);
                    }}
                    onClick={() => handleRemoveDeckCard(index)}
                  />
                ))}
              </div>
            </div>
  
            <div>
              <h4 className="text-sm font-semibold">⚡ 能量卡 ({energyCards.length} / 20)：</h4>
              <div className="flex flex-wrap gap-1">
                {energyCards.map((card, index) => (
                  <CardImage
                    key={`${card.id}-e-${index}`}
                    card={card}
                    version={card.version}
                    style={{ width: "63px", height: "88px" }}
                    onZoom={(url, cardData) => {
                      setZoomImageUrl(url);
                      setZoomCard(cardData);
                    }}
                    onClick={() => handleRemoveEnergyCard(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {renderZoomCard()}
      </div>
    );
  }

  export default DeckBuilder;
  