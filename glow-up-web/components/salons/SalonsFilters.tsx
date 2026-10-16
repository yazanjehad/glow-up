"use client";

import SalonCard from "./SalonCard";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SalonUi } from "@/integration/services/provider/provider.types";

type SalonsFiltersProps = {
  salons: SalonUi[];
  title: string;
  onClear?: () => void;
};

const SalonsFilters = ({ salons, title, onClear }: SalonsFiltersProps) => {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (salons.length === 0) return null;

  return (
<section dir={isRTL ? "rtl" : "ltr"} className="w-full py-5 bg-white">
  <div className="max-w-[95%] md:max-w-[85%] lg:max-w-[80%] mx-auto bg-[#FBFBFB] rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
    
    <div className="px-4 py-8 md:px-10 md:py-12 lg:px-16 lg:py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-14 pb-6 md:pb-10 border-b border-gray-200/50 gap-6 md:gap-8">
        
        <div className="flex items-center gap-6">
     
          
          <div className="space-y-2"> 
            <h2 className="font-extrabold text-3xl text-gray-900 tracking-tight leading-tight">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#79A66B] animate-pulse" />
              <p className="text-[15px] text-gray-500 font-semibold uppercase tracking-wider">
                {t("found_results", { count: salons.length, defaultValue: `تم العثور على ${salons.length} نتيجة` })}
              </p>
            </div>
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[15px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-sm transition-all duration-300 border border-gray-100/50"
          >
            <X size={20} />
            {t("clear_search", { defaultValue: "إلغاء البحث" })}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
        {salons.map((salon) => (
          <div key={salon.id} className="w-full">
            <SalonCard salon={salon} />
          </div>
        ))}
      </div>
      
    </div>
  </div>
</section>
  );
};

export default SalonsFilters;