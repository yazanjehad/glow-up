'use client';
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { cn } from "@/lib/utils";

interface BookNowProps {
  btnName?: string;
  disabled?: boolean;
  destination?: keyof ReturnType<typeof useNavigationFlow>;
  destinationParams?: string; // For functions like goToSalon that need parameters
  onClick?: () => void;            
  className?: string;
}

const BookNow: React.FC<BookNowProps> = ({
  btnName = "bookNow",
  disabled = false,
  destination,
  destinationParams,
  onClick,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const nav = useNavigationFlow();

  const handleClick = () => {
    if (disabled) return;

   
    if (onClick) {
      onClick();
      return;
    }

  
    if (destination && nav[destination]) {
      const navFunction = nav[destination] as any;
      if (destinationParams) {
        navFunction(destinationParams);
      } else {
        navFunction();
      }
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "rounded-[0.625rem] px-5 py-2.5 h-[2.75rem] flex items-center justify-center transition-colors shadow-sm",
        "min-w-[6.4375rem] w-fit",
        disabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#79A66B] hover:bg-[#6c965f]",
        className
      )}
    >
      <span
        className="text-white text-[1.0rem] font-medium leading-none whitespace-nowrap"
        style={{ fontFamily: isRTL ? "DIN Next LT Arabic" : "inherit" }}
      >
        {t(btnName)}
      </span>
    </button>
  );
};

export default BookNow;
