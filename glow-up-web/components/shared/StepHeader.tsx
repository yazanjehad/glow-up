"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepHeaderProps {
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
}

export default function StepHeader({
  step = 1,
  totalSteps = 5,
  onBack,
}: StepHeaderProps) {
  const { i18n } = useTranslation();
  const percent = Math.min(100, (step / totalSteps) * 100);

  const isRTL = i18n.dir() === "rtl";

  return (
    <div className="w-full flex flex-col items-start gap-3 mb-8">
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className={`group flex items-center justify-center p-1 transition-all duration-300 active:scale-75 ${
            isRTL ? "ml-auto" : ""
          }`}
        >
          {isRTL ? (
            <ArrowRight
              size={28}
              strokeWidth={1.2}
              className="text-gray-900 transition-transform duration-300 group-hover:translate-x-1"
            />
          ) : (
            <ArrowLeft
              size={28}
              strokeWidth={1.2}
              className="text-gray-900 transition-transform duration-300 group-hover:-translate-x-1"
            />
          )}
        </button>
      )}

      <div className="relative h-[5px] w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`absolute top-0 h-full bg-[#7FA96B] transition-all duration-1000 ease-in-out rounded-full overflow-hidden`}
          style={{
            width: `${percent}%`,
            left: isRTL ? 0 : "auto",   
            right: isRTL ? "auto" : 0, 
          }}
        >
          <div
            className={`absolute inset-0 w-full h-full -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent ${
              isRTL ? "" : "rotate-180 origin-center" 
            }`}
          />
        </div>
      </div>
    </div>
  );
}