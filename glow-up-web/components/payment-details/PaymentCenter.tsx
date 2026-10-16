'use client';

import React, { ReactNode } from "react";
import { Check, SaudiRiyal } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PaymentCenterProps {
  className?: string;
  titleKey?: string; 
  amount?: number;
  currencyIcon?: ReactNode;
  isActive?: boolean;      
  onClick?: () => void;    
}

const PaymentCenter: React.FC<PaymentCenterProps> = ({
  className = "",
  titleKey = "paymentCenterTitle", 
  amount = 0,
  currencyIcon = <SaudiRiyal className="w-4 h-4 text-[#27AE60]" />,
  isActive = false,
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex justify-center ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="
          flex flex-col justify-between
          w-full max-w-3xl
          gap-4
          rounded-[1.25rem] border border-[#F0F0F0] bg-white p-4 md:p-6
          shadow-[0_0.5rem_2rem_0_#00000014]
        "
      >
        <div className="flex w-full max-h-[1.4375rem] items-center justify-between">
          <span
            className="text-[#212121] text-[0.875rem] font-bold leading-none"
            style={{ fontFamily: isRTL ? "DIN Next LT Arabic" : "inherit" }}
          >
            {t(titleKey)}
          </span>

        
          <div className={`flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full ${isActive ? 'bg-[#79A66B]' : 'bg-[#E0E0E0]'}`}>
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCenter;
