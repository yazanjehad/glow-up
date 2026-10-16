"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DayPill from "@/components/booking-slot/DayPill";
import TimePill from "@/components/booking-slot/TimePill";
import type { DayItem, TimeItem } from "../../app/models/booking-slot-types";
import { MonthYearPicker } from "@/components/booking-slot/MonthYearPicker";

type Props = {
  year: number;
  month: number;
  days: DayItem[];
  timesByDay: Record<string, TimeItem[]>;
  onDayChange?: (value: { dayId: string }) => void;
  onTimeChange?: (value: { timeId: string }) => void;
  // year-month change
  onMonthYearChange?: (v: { year: number; month: number }) => void;
  isLoadingTimes?: boolean;
};

// BookingSlot component
export default function BookingSlot({
  year,
  month,
  days,
  timesByDay,
  onMonthYearChange,
  onDayChange,
  onTimeChange,
  isLoadingTimes,
}: Props) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();

  const visibleDays = useMemo(() => {
    //   month current: show from today date
    if (year === todayYear && month === todayMonth) {
      return days.filter((d) => d.date >= todayDate);
    }
    // new month starting from 1st
    return days;
  }, [days, year, month, todayYear, todayMonth, todayDate]);

  // first selectable day id
  const firstSelectableDayId = useMemo(() => {
    return (
      visibleDays.find((d) => d.status !== "unavailable")?.id ??
      visibleDays[0]?.id ??
      ""
    );
  }, [visibleDays]);

  const [selectedDayId, setSelectedDayId] = useState(firstSelectableDayId);
  const [selectedTimeId, setSelectedTimeId] = useState("");
  const onDayChangeRef = useRef<Props["onDayChange"]>(onDayChange);

  useEffect(() => {
    onDayChangeRef.current = onDayChange;
  }, [onDayChange]);

  useEffect(() => {
    setSelectedDayId((prev) =>
      prev === firstSelectableDayId ? prev : firstSelectableDayId
    );
    setSelectedTimeId("");
    if (firstSelectableDayId) {
      onDayChangeRef.current?.({ dayId: firstSelectableDayId });
    }
  }, [firstSelectableDayId]);

  const times = useMemo(() => {
    const rawTimes = timesByDay[selectedDayId] ?? [];
    return rawTimes.map((x) => ({
      ...x,
      label: formatTimeLabel(x.id, t),
    }));
  }, [timesByDay, selectedDayId, t]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    
    // In RTL, scrollLeft is 0 at the start (right) and negative as we scroll left.
    // In LTR, scrollLeft is 0 at the start (left) and positive as we scroll right.
    const absScrollLeft = Math.abs(scrollLeft);
    const hasReachedEnd = absScrollLeft + clientWidth >= scrollWidth - 5;
    const hasReachedStart = absScrollLeft <= 5;

    if (isRTL) {
      // Visually left is "forward" (towards end), visually right is "backward" (towards start)
      setCanScrollLeft(!hasReachedEnd);
      setCanScrollRight(!hasReachedStart);
    } else {
      // Visually right is "forward" (towards end), visually left is "backward" (towards start)
      setCanScrollRight(!hasReachedEnd);
      setCanScrollLeft(!hasReachedStart);
    }
  }, [isRTL]);

  useEffect(() => {
    // Check initial scroll state after render
    const timeout = setTimeout(checkScroll, 100);
    return () => clearTimeout(timeout);
  }, [visibleDays, isRTL, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      const finalDirection = direction === "left" ? -1 : 1;
      scrollRef.current.scrollBy({
        left: finalDirection * scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // handle select day
  const handleSelectDay = (dayId: string) => {
    const day = visibleDays.find((d) => d.id === dayId);
    if (!day || day.status === "unavailable") return;

    setSelectedDayId(dayId);
    setSelectedTimeId("");
    onDayChange?.({ dayId });
  };

  // handle select time
  const handleSelectTime = (timeId: string) => {
    setSelectedTimeId(timeId);
    onTimeChange?.({ timeId });
  };

  // format time label
  function formatTimeLabel(time24: string, t: any) {
    const [hStr, mStr] = time24.split(":");
    const h = Number(hStr);
    const m = Number(mStr);

    // convert to 12-hour format
    const isPM = h >= 12;
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const minutes = String(m).padStart(2, "0");

    const ampm = isPM ? t("pm") : t("am");
    return `${hour12}:${minutes} ${ampm}`;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div className="w-full xs:w-auto">
            <MonthYearPicker
              value={{ year, month }}
              onChange={(v) => onMonthYearChange?.(v)}
              yearsAhead={30}
              locale={i18n.language.startsWith("ar") ? "ar" : "en"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-slate-700 whitespace-nowrap">{t("bookingSlot.selected")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
              <span className="text-slate-500 whitespace-nowrap">{t("bookingSlot.available")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-red-600 whitespace-nowrap">{t("bookingSlot.unavailable")}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Left Arrow - show if can scroll left */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-[-12px] top-[40%] -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center animate-in fade-in zoom-in duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-[#7BAE6A]" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="mt-2 flex flex-row flex-nowrap items-center gap-3 overflow-x-auto overflow-y-hidden touch-pan-x scroll-smooth pb-4 no-scrollbar px-1"
          >
            {visibleDays.map((day) => (
              <DayPill
                key={day.id}
                item={day}
                isSelected={day.id === selectedDayId}
                onSelect={handleSelectDay}
              />
            ))}
          </div>

          {/* Right Arrow - show if can scroll right */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-[-12px] top-[40%] -translate-y-1/2 z-10 p-2 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center animate-in fade-in zoom-in duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-[#7BAE6A]" />
            </button>
          )}
        </div>
      </div>

      {/* Choose time */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
        <div className="text-sm font-bold text-slate-800">
          {t("bookingSlot.chooseTime")}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3 min-h-[100px]">
        {isLoadingTimes ? (
          <div className="col-span-full flex flex-col items-center justify-center py-8 gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7BAE6A] border-t-transparent" />
            <p className="text-gray-400 text-sm">{t("loading")}</p>
          </div>
        ) : times.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-400 text-sm">
              {t("bookingSlot.noSlotsAvailable")}
            </p>
          </div>
        ) : (
          times.map((time) => (
            <TimePill
              key={time.id}
              item={time}
              isSelected={time.id === selectedTimeId}
              onSelect={handleSelectTime}
            />
          ))
        )}
      </div>
    </div>
  );
}


