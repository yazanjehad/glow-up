'use client';
import React from "react";
import { useTranslation } from "react-i18next";
import CardItem from "./CardItem";

interface Service {
  id: number;
  type?: string;
  name?: string;
  last4?: string;
  logo?: string;
}

interface OtherPaymentsProps {
  className?: string;
  services?: Service[];
  activePayment: string | null;           
  onSelectPayment?: (id: string) => void;   
}

const OtherPayments: React.FC<OtherPaymentsProps> = ({
  className = "",
  services = [],
  activePayment,
  onSelectPayment,
}) => {
  const { t, i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="
          flex flex-col justify-between
          w-[44rem] max-h-[11.4375rem]
          gap-4
          rounded-[1.25rem] border border-[#F0F0F0] bg-white p-[1.5rem]
          shadow-[0_0.5rem_2rem_0_#00000014]
        "
        dir={direction}
      >
        <div className="flex w-full max-h-[1.4375rem] items-center justify-between">
          <span
            className=" max-w-[10rem] max-h-[1.3125rem] text-[0.875rem] font-bold leading-none text-[#212121]"
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t('otherPaymentMethods')}
          </span>
        </div>

        <div className="flex flex-col gap-[0.5rem]">
          {services.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isActive={activePayment === `other-${card.id}`}  
              onClick={() => onSelectPayment && onSelectPayment(`other-${card.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OtherPayments;
