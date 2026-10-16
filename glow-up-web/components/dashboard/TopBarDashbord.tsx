"use client";

import React from "react";
import { FileText, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TopBarDashbordProps {
  title: string;
  className?: string;
  activeView: string;
  onShowOrders?: () => void;
  onShowCalendar?: () => void;
}

const TopBarDashbord: React.FC<TopBarDashbordProps> = ({
  title,
  className,
  activeView,
  onShowOrders,
  onShowCalendar,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  return (
    <div
      className={`flex items-center justify-between w-full p-4 max-w-[1100px] bg-white rounded-2xl shadow-sm border border-gray-50 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <h2 className="text-xl font-bold text-[#1A2B3C]">{t(title)}</h2>

    <div className="flex gap-2">
  <button
    onClick={onShowCalendar}
    className={`p-2 rounded-full transition-all ${
      activeView === "calendar"
        ? "bg-gray-200 text-gray-700 shadow-sm" 
        : "bg-gray-50 text-gray-300 hover:bg-gray-100"
    }`}
  >
    <LayoutGrid size={24} /> 
  </button>

  <button
    onClick={onShowOrders}
    className={`p-2 rounded-full transition-all ${
      activeView === "orders"
        ? "bg-green-50 text-green-600 shadow-sm" 
        : "bg-gray-50 text-gray-300 hover:bg-green-50"
    }`}
  >
    <FileText size={24} />
  </button>
</div>
    </div>
  );
};

export default TopBarDashbord;