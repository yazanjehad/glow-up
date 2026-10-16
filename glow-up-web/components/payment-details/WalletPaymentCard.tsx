'use client';
import React, { ReactNode } from "react";
import { Check, SaudiRiyal } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WalletPaymentCardProps {
  className?: string;
  title?: string;  
  amount?: number;
  currencyIcon?: ReactNode;
  isActive?: boolean;       
  onClick?: () => void;    
}

const WalletPaymentCard: React.FC<WalletPaymentCardProps> = ({
  className = "",
  title = "walletPaymentTitle", 
  amount = 0,
  currencyIcon = <SaudiRiyal className="h-[1rem] w-[1rem] text-[#27AE60]" />,
  isActive = false,        
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={`flex justify-center ${className}`} 
      dir={isRTL ? "rtl" : "ltr"} 
      onClick={onClick} 
    >
      <div
        className="
          flex flex-col justify-between
          w-full max-w-3xl
          rounded-[1.25rem] border border-[#F0F0F0] bg-white
          px-6 py-6
          shadow-[0_0.5rem_2rem_0_#00000014]
          cursor-pointer
        "
      >
        <div className="flex w-full items-center justify-between">
          <span
            className={`text-[0.875rem] font-bold leading-none text-[#212121] ${isRTL ? 'text-right' : 'text-left'}`}
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t(title)}
          </span>

         
          <div className={`flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full ${isActive ? 'bg-[#79A66B]' : 'bg-[#E0E0E0]'}`}>
            <Check className="h-[0.75rem] w-[0.75rem] text-white" />
          </div>
        </div>

        <div className="mt-[0.5rem] flex w-full items-center justify-between">
          <span
            className={`text-[0.875rem] font-normal leading-none text-[#8B8A8A] ${isRTL ? 'text-right' : 'text-left'}`}
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t("amountDue")}
          </span>

          <div className="flex items-center gap-[0.25rem]">
            <span
              className="text-center text-[1rem] font-medium leading-none text-[#27AE60]"
              style={{ fontFamily: "DIN Next LT Arabic" }}
            >
              {amount}
            </span>
            {currencyIcon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPaymentCard;
