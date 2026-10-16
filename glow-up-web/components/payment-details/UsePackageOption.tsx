'use client';

import React from "react";
import { Check, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserPackageResponseDto } from "@/integration/services/user-packages/user-packages.types";

interface UsePackageOptionProps {
  className?: string;
  userPackages: UserPackageResponseDto[];
  selectedPackageId: string | null;
  onSelectPackage: (packageId: string | null) => void;
  isActive?: boolean;
  onClick?: () => void;
}

const UsePackageOption: React.FC<UsePackageOptionProps> = ({
  className = "",
  userPackages,
  selectedPackageId,
  onSelectPackage,
  isActive = false,
  onClick,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const availablePackages = userPackages.filter(pkg => {
    const status = (pkg.status || "").toUpperCase();
    const isActive = status === "ACTIVE";
    const items = Array.isArray(pkg.items) ? pkg.items : [];
    const hasRemaining = items.some(item => Number(item?.remaining ?? 0) > 0);
    return isActive && hasRemaining;
  });

  return (
    <div 
      className={`flex justify-center ${className}`} 
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={`
          flex flex-col justify-between
          w-full max-w-3xl
          gap-4
          rounded-[1.25rem] bg-white p-4 md:p-6
          shadow-[0_0.5rem_2rem_0_#00000014]
          transition-all duration-200
          ${isActive ? 'border-2 border-[#79A66B]' : 'border border-[#F0F0F0]'}
        `}
      >
        <div 
          className="flex w-full items-center justify-between cursor-pointer"
          onClick={onClick}
        >
          <div className="flex items-center gap-2">
            <Package className={`w-5 h-5 ${isActive ? 'text-[#79A66B]' : 'text-gray-400'}`} />
            <span
              className={`text-[0.875rem] font-bold leading-none ${isActive ? 'text-[#79A66B]' : 'text-[#212121]'}`}
              style={{ fontFamily: isRTL ? "DIN Next LT Arabic" : "inherit" }}
            >
              {t('useCurrentPackage')}
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
            {availablePackages.length > 0 ? (
              <>
                <span className="text-xs text-[#8B8A8A] font-medium">
                  {t('selectPackage')}:
                </span>
                {availablePackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg._id;
                  return (
                    <div
                      key={pkg._id}
                      onClick={() => onSelectPackage(pkg._id)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg cursor-pointer
                        transition-all duration-200
                        ${isSelected 
                          ? 'bg-[#79A66B]/10 border-2 border-[#79A66B]' 
                          : 'bg-gray-50 border border-gray-200 hover:border-[#79A66B]/50'
                        }
                      `}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-[#79A66B]' : 'text-[#212121]'}`}>
                          {pkg.packageName}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {pkg.items.map((item, idx) => (
                            <span key={idx} className="text-xs text-[#8B8A8A]">
                              {item.name} - {t('remaining')}: {item.remaining}/{item.total}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div 
                        className={`flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-[#79A66B]' : 'bg-[#E0E0E0]'}`}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <Package className="w-12 h-12 text-gray-300 mb-2" />
                <span className="text-sm text-[#8B8A8A] text-center">
                  {t('noPackagesAvailable')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsePackageOption;
