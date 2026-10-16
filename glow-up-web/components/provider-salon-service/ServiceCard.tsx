"use client";

import { useTranslation } from "react-i18next";
import { ChevronLeft, Clock, Banknote, SaudiRiyal } from "lucide-react";
import type { ProviderService } from "@/app/models/provider-service-types";

function formatDurationShort(minutes: number, lang: string) {
  return lang === "ar" ? `${minutes} د` : `${minutes} min`;
}

interface ServiceCardProps {
  service: ProviderService;
  onClick: () => void;
  onToggleActive?: (id: string, active: boolean) => void;
}

export default function ServiceCard({
  service,
  onClick,
  onToggleActive,
}: ServiceCardProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isActive = service.isActive ?? true;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive?.(service.id, !isActive);
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex w-full cursor-pointer items-center justify-between rounded-3xl border p-5 transition-all duration-300 
        ${
          isActive
            ? "border-gray-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md"
            : "border-gray-100 bg-gray-50/50 opacity-70"
        }`}
    >
      <div className="flex items-center gap-5 flex-1">
        <div
          onClick={handleToggle}
          className={`relative h-6 w-12 flex-shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out
            ${isActive ? "bg-green-500" : "bg-gray-300"}`}
        >
          <div
            className={`h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out
              ${
                isActive
                  ? isRTL
                    ? "-translate-x-6"
                    : "translate-x-6"
                  : "translate-x-0"
              }`}
          />
        </div>

        <div
          className={`flex flex-col gap-1 ${isRTL ? "text-right" : "text-left"}`}
        >
          <div className="flex items-center gap-2">
            <h3
              className={`text-lg font-bold tracking-tight transition-colors ${isActive ? "text-gray-900" : "text-gray-400"}`}
            >
              {service.name}
            </h3>
            {!isActive && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                {isRTL ? "مغلقة" : "Closed"}
              </span>
            )}
          </div>


          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-400"}`}
            >
              <Banknote className="h-4 w-4" />
              <span className="flex items-center gap-1">
                {service.price} <SaudiRiyal className="h-4 w-4" />
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 shrink-0">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap inline-block">
                {formatDurationShort(service.durationMinutes, i18n.language)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl 
    bg-gray-50 text-gray-400 `}
        >
          <ChevronLeft className={`h-6 w-6 ${!isRTL && "rotate-180"}`} />
        </div>
      </div>
    </div>
  );
}
