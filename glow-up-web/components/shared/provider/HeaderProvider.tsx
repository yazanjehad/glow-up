"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

type HeaderProviderProps = {
  titleKey: string;
  subtitleKey?: string;
};

const HeaderProvider = ({ titleKey, subtitleKey }: HeaderProviderProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="relative w-full py-12 px-6 overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-64 h-64 bg-gray-50 rounded-full -translate-x-1/2 -translate-y-1/2 -z-10" />

      <div
        className={`max-w-4xl mx-auto text-center flex flex-col items-center gap-3 ${
          isRTL ? 'dir-rtl' : 'dir-ltr'
        }`}
      >
        <h1 className="text-[#1a2b3c] text-[30px] font-medium leading-[100%] tracking-tight">
          {t(titleKey)}
        </h1>

        {subtitleKey && (
          <p className="text-gray-500 text-[18px] font-normal leading-[20px]">
            {t(subtitleKey)}
          </p>
        )}
      </div>
    </div>
  );
};

export default HeaderProvider;
