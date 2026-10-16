"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  titleKey: string;
  iconHref?: string;
  onIconClick?: () => void;
  iconAriaLabelKey: string;
  icon?: ReactNode;
}

export function TopBar({ titleKey, iconHref, onIconClick, iconAriaLabelKey, icon }: TopBarProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();

  const defaultIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );

  const handleClick = () => {
    if (onIconClick) {
      onIconClick();
    } else if (iconHref) {
      router.push(iconHref);
    } else {
      router.back(); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 pt-4 md:pt-8 w-full">
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 px-3 md:px-5 py-3 md:py-4 shadow-[0_0.5rem_2rem_0_#00000014]">
        <div className="flex items-center justify-between gap-4">
          <div className={cn("flex-1 min-w-0 font-bold text-gray-800 text-sm md:text-lg", isRTL ? "text-right" : "text-left")}>
            <span className="block truncate">{t(titleKey)}</span>
          </div>

          <Button 
            onClick={handleClick} 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl shrink-0" 
            aria-label={t(iconAriaLabelKey)}
          >
            <span className="sr-only">{t(iconAriaLabelKey)}</span>
            {icon || defaultIcon}
          </Button>
        </div>
      </div>
    </div>
  );
}