'use client';
import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface Service {
  count: number;
  name: string; 
}

interface CurrentPlanCardProps {
  className?: string;
  services?: Service[];
}

const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  className = "",
  services = [],
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';  

  return (
    <div className={`flex justify-center ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        className="
          flex h-[8.9375rem] w-[44rem] flex-col justify-between
          rounded-[1.25rem] border border-[#F0F0F0] bg-white
          px-[1.5rem] py-[1.5rem]
          shadow-[0_0.5rem_2rem_0_#00000014]
        "
      >
         
        <div className="flex h-[1.4375rem] w-full items-center justify-between">
          <span
            className={`h-[1.3125rem] text-[0.875rem] font-bold leading-none text-[#212121] ${isRTL ? 'text-right' : 'text-left'}`}
            style={{ fontFamily: "DIN Next LT Arabic" }}
          >
            {t('currentPlanTitle')}
          </span>

          <div className="flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-[#79A66B]">
            <Check className="h-[0.75rem] w-[0.75rem] text-white" />
          </div>
        </div>

        
        <div className="flex flex-col gap-[0.625rem] mt-2">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex h-[1.4375rem] w-full items-center justify-between"
            >
              <span
                className={`text-[0.875rem] font-normal leading-none text-[#8B8A8A] ${isRTL ? 'text-right' : 'text-left'}`}
                style={{ fontFamily: "DIN Next LT Arabic" }}
              >
                
                {t('remainingServices', { count: service.count, name: t(service.name) })}
              </span>

              <div className="flex h-[1.125rem] w-[1.125rem] items-center justify-center">
                <Check className="h-[1.125rem] w-[1.125rem] text-[#27AE60]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrentPlanCard;
