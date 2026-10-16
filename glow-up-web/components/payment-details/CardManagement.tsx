"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Bell, PlusCircle } from "lucide-react";
import CardItem, { Card } from "./CardItem";

interface CardManagementProps {
  className?: string;
  activeCardId?: number;
  onSelectCard?: (id: number) => void;
}

const CardManagement: React.FC<CardManagementProps> = ({
  className = "",
  activeCardId,
  onSelectCard,
}) => {
  const { t } = useTranslation();

  const cards: Card[] = [];

  return (
    <div
      className={`gap-5 flex flex-col justify-between w-full max-w-3xl p-6 md:p-8 bg-white rounded-3xl shadow-[0_0.5rem_2rem_0_#00000014] border border-gray-100 ${className}`}
    >
      <div className="flex items-center justify-between w-full gap-3 p-4 border border-[#E0E0E0] rounded-xl cursor-pointer hover:border-green-200 transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E2ECDF] text-green-700 transition-all">
          <Bell size={18} />
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 text-right gap-1">
          <h3
            className="text-sm md:text-base font-bold text-gray-800 text-right"
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t("addCreditCardTitle")}
          </h3>
          <p
            className="text-[10px] md:text-xs font-semibold text-gray-400 text-right"
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t("addCreditCardDesc")}
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#79A66B]">
          <PlusCircle size={16} className="text-white" />
        </div>
      </div>

      <div className="space-y-[0.75rem]">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isActive={card.id === activeCardId}
            onClick={() => onSelectCard && onSelectCard(card.id!)}
          />
        ))}
      </div>
    </div>
  );
};

export default CardManagement;
