import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";  

export interface Card {
  id?: number;
  type?: string;
  name?: string;
  nameKey?: string;  
  last4?: string;
  logo?: string;
}

interface CardItemProps {
  card: Card;
  isActive?: boolean;    
  onClick?: () => void;    
}

const CardItem: React.FC<CardItemProps> = ({ card, isActive = false, onClick }) => {
  const { t } = useTranslation();  

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex flex-row-reverse items-center justify-center w-[650px] max-h-[2.5rem] rounded-lg border p-[0.625rem] hover:bg-gray-50 transition-colors cursor-pointer select-none ${
        isActive ? "border-green-500 bg-green-50" : "border-[#E1E4E8] bg-white"
      }`}
    >
      <div className="flex flex-row-reverse items-center justify-between w-[38.3125rem] max-h-[1.25rem]">
        <div
          className={`flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-[0.5625rem] p-[0.06rem] ${
            isActive ? "bg-[#79A66B]" : "bg-[#E0E0E0]"
          }`}
        >
          <Check className="w-3 h-3 text-white" />
        </div>

        <div className="flex items-center gap-[.5rem]">
          <div className="flex w-8 h-[1.25rem] justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.logo}
              alt={card.type}
              className="h-[1.25rem] object-contain"
            />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-[0.5rem] text-center">
              <span
                className="text-gray-400 text-[0.75rem] leading-none"
                style={{
                  fontFamily: "DIN Next LT Arabic",
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                {card.nameKey ? t(card.nameKey) : card.name} 
              </span>
              <span
                className="text-gray-400 text-[0.75rem] leading-none"
                style={{
                  fontFamily: "DIN Next LT Arabic",
                  fontWeight: 400,
                  fontStyle: "normal",
                }}
              >
                {card.last4}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardItem;
