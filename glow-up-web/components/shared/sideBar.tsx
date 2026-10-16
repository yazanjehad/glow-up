"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import {
  MoreHorizontal,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SideBarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
  isActive?: boolean;
};

type Props = {
  items: SideBarItem[];
  defaultActiveHref?: string;
  onActiveChange?: (href: string) => void;
};

export default function SideBar({
  items,
  defaultActiveHref,
  onActiveChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [activeHref, setActiveHref] = useState<string>(() => {
    const preset = items.find((x) => x.isActive)?.href;
    return preset ?? defaultActiveHref ?? "";
  });

  useEffect(() => {
    if (activeHref && items.some((x) => x.href === activeHref)) return;

    const preset = items.find((x) => x.isActive)?.href;
    setActiveHref(preset ?? defaultActiveHref ?? "");
  }, [items, activeHref, defaultActiveHref]);

  const viewItems = useMemo(() => {
    return items.map((it) => ({
      ...it,
      isActive: it.href === activeHref,
    }));
  }, [items, activeHref]);

  // Mobile split: 3 visible + the rest in "More"
  const visibleMobile = viewItems.slice(0, 3);
  const hiddenMobile = viewItems.slice(3);

  const renderItem = (item: SideBarItem & { isActive: boolean }, isMobile = false) => {
    const Icon = item.icon;
    const isActive = item.isActive;
    const isUpgrade = !!item.highlight;

    return (
      <Link
        href={item.href}
        onClick={() => {
          setActiveHref(item.href);
          onActiveChange?.(item.href);
        }}
        className={cn(
          "flex items-center transition-all duration-200",
          isMobile 
            ? "flex-col justify-center text-center py-1.5 px-0.5 flex-1 min-w-0" 
            : "gap-2 lg:gap-3 rounded-xl lg:rounded-2xl px-3.5 py-2.5 lg:px-4 lg:py-3 text-[18px] font-bold w-full",
          isActive
            ? isMobile ? "text-[#6FA35D]" : "bg-[#7BAE6A]/10 text-[#6FA35D] shadow-sm ring-1 ring-[#7BAE6A]/20"
            : isUpgrade
              ? "text-[#27AE60] hover:bg-[#27AE60]/10"
              : "text-slate-600 hover:bg-slate-50",
          !isMobile && "mb-1"
        )}
      >
        <Icon
          size={isMobile ? 18 : 20}
          className={cn(
            "shrink-0",
            isActive
              ? "text-[#6FA35D]"
              : isUpgrade
                ? "text-[#27AE60]"
                : "text-slate-500"
          )}
        />
        <span className={cn(
          "leading-none whitespace-nowrap overflow-hidden text-ellipsis w-full px-0.5",
          isMobile ? "text-[8.5px] mt-1.5 font-bold" : "text-[18px]"
        )}>
          {t(item.label)}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* MOBILE: Compact 4-slot bar */}
      <div className="lg:hidden w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
        <div className="flex items-center justify-around w-full" dir={isRTL ? "rtl" : "ltr"}>
          {visibleMobile.map((item) => (
            <div key={item.href} className="flex-1 flex justify-center overflow-hidden">
              {renderItem(item, true)}
            </div>
          ))}

          {hiddenMobile.length > 0 && (
            <div className="flex-1 flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center py-1.5 px-0.5 w-full text-center group min-w-0">
                    <MoreHorizontal size={18} className="text-slate-500 group-hover:text-[#6FA35D] transition-colors" />
                    <span className="text-[8.5px] mt-1.5 font-bold text-slate-500 group-hover:text-[#6FA35D] transition-colors leading-none">
                      {t("more")}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-52 rounded-xl p-1.5 shadow-xl border-gray-100">
                  {hiddenMobile.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem 
                        key={item.href}
                        onClick={() => {
                          setActiveHref(item.href);
                          onActiveChange?.(item.href);
                        }}
                        asChild
                      >
                        <Link 
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                            item.isActive ? "bg-[#7BAE6A]/10 text-[#6FA35D] font-bold" : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <Icon size={18} className={item.isActive ? "text-[#6FA35D]" : "text-slate-500"} />
                          <span className="text-[13px]">{t(item.label)}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP: Vertical aside */}
      <aside 
        dir={isRTL ? "rtl" : "ltr"}
        className="hidden lg:block w-[329px] bg-white rounded-[24px] shadow-sm border border-gray-100 p-4"
      >
        <ul className="flex flex-col">
          {viewItems.map((item) => (
            <li key={item.href}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
