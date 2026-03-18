import { parseKey } from "../../utils/imageIndex";
import React, { useRef } from "react";

function ZoomModal({ card, imageUrl, onClose, onPrev, onNext }) {
  const zoomImageRef = useRef(null);
  const translatedRef = useRef(null);

  if (!card || !imageUrl) return null;

  // ✅ 用 key 解析
  const entry = card.key ? parseKey(card.key) : null;

  const base = import.meta.env.BASE_URL || "/";
  let primary = null;
  let fallback = null;

  if (entry) {
    // 方案1：依照 folder
    primary = `${base}webpcards/${entry.folder}-trans/${entry.id}.webp`;

    // 方案2：依照 id 前綴 (hSD01-017 → hSD01)
    const prefix = entry.id.split("-")[0];
    fallback = `${base}webpcards/${prefix}-trans/${entry.id}.webp`;
  }

  const handleError = (e) => {
    if (primary && fallback && e.currentTarget.src.endsWith(primary)) {
      console.warn(`⚠️ 翻譯圖找不到 primary: ${primary}，改用 fallback`);
      e.currentTarget.src = fallback;
    } else {
      console.error(`❌ 翻譯圖完全不存在: ${primary} / ${fallback}`);
      e.currentTarget.style.display = "none";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto" onClick={onClose}>
      <div
        className="min-h-screen flex items-start justify-center py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-white rounded-xl p-4 w-full md:w-auto max-w-[95vw] md:max-w-[90vw]">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* 原圖 */}
            <img
              src={imageUrl}
              alt="原圖"
              ref={zoomImageRef}
              className="object-contain w-auto max-w-[90%] md:max-w-none md:w-auto md:max-h-[80vh]"
            />

            {/* 翻譯圖 */}
            {primary && (
              <img
                src={primary}
                alt="翻譯圖"
                ref={translatedRef}
                className="object-contain w-auto max-w-[90%] md:max-w-none md:w-auto md:max-h-[80vh]"
                onError={handleError}
              />
            )}
          </div>

          {/* 桌機右上角關閉 */}
          <button
            onClick={onClose}
            className="hidden md:block absolute top-3 right-3 text-3xl leading-none text-black"
            aria-label="close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 左右箭頭 */}
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="fixed left-4 top-1/2 -translate-y-1/2 text-3xl text-white bg-black/40 hover:bg-black/70 px-2 py-1 rounded"
        >
          ←
        </button>
      )}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="fixed right-4 top-1/2 -translate-y-1/2 text-3xl text-white bg-black/40 hover:bg-black/70 px-2 py-1 rounded"
        >
          →
        </button>
      )}

      {/* 手機右下角關閉 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="md:hidden fixed bottom-6 right-6 z-[60] bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
      >
        ✕
      </button>
    </div>
  );
}

export default ZoomModal;
