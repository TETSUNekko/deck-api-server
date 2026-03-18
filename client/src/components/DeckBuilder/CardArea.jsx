// src/components/DeckBuilder/CardArea.jsx
import React from "react";
import CardImage from "./CardImage";

function CardArea({ filteredCards, onAddCard, onZoom }) {
  return (
    <div className="w-full md:w-[53%] h-full">
      <div
        className="overflow-y-auto px-2 pt-6 pb-2"
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        <div className="flex flex-wrap gap-0.5 items-start">
          {filteredCards.map((card) => (
            <div
              key={card.key}
              className="relative cursor-pointer w-[clamp(100px,24vw,160px)] aspect-[2/3]"
              onClick={() => onAddCard(card, card.version)}
            >
              <CardImage
                card={card}
                version={card.version}
                className="w-full h-full"
                onZoom={(url, cardData) => {
                  const index = filteredCards.findIndex(
                    (c) => c.key === cardData.key
                  );
                  onZoom(url, cardData, index);
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center truncate">
                {card.id} {card.version}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CardArea;

