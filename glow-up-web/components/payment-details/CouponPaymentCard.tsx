'use client';

import React from "react";
import { Check, BadgePercent } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaudiRiyal } from "lucide-react";

interface CouponPaymentCardProps {
  className?: string;
  couponCode: string;
  discount: number;
  isActive?: boolean;
  onClick?: () => void;
}

const CouponPaymentCard: React.FC<CouponPaymentCardProps> = ({
  className = "",
  couponCode,
  discount,
  isActive = false,
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className={`flex justify-center ${className}`} dir={isRTL ? "rtl" : "ltr"}>
      <div
        onClick={onClick}
        className={`
          flex flex-col justify-between
          w-full max-w-3xl
          gap-4
          rounded-[1.25rem] bg-white p-4 md:p-6
          shadow-[0_0.5rem_2rem_0_#00000014]
          transition-all duration-200
          cursor-pointer
          ${isActive ? 'border-2 border-[#79A66B]' : 'border border-[#F0F0F0]'}
        `}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgePercent className={`w-5 h-5 ${isActive ? 'text-[#79A66B]' : 'text-gray-400'}`} />
            <span
              className={`text-[0.875rem] font-bold leading-none ${isActive ? 'text-[#79A66B]' : 'text-[#212121]'}`}
              style={{ fontFamily: isRTL ? "DIN Next LT Arabic" : "inherit" }}
            >
              {t('payByCoupon')}
            </span>
          </div>

          <div 
            className={`flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full transition-colors ${isActive ? 'bg-[#79A66B]' : 'bg-[#E0E0E0]'}`}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>

        {isActive && (
          <div className="flex flex-col gap-3 mt-2 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#79A66B]/10 border border-[#79A66B]/30">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#8B8A8A] font-medium">
                  {t('couponCode')}:
                </span>
                <span className="text-sm font-bold text-[#79A66B]">
                  {couponCode}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-[#79A66B]">
                  {discount}
                </span>
                <SaudiRiyal className="w-5 h-5 text-[#79A66B]" />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs text-green-700">
                {t('couponAppliedSuccess')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponPaymentCard;
