"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import { ProviderAppointmentsService } from "@/integration/services/provider/providerAppointments.service";
import { WorkingHours } from "@/integration/services/provider/provider.types";

const WeeklyCalendar = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const dayMap = useMemo(
    () => ({
      SUNDAY: t("days.sunday"),
      MONDAY: t("days.monday"),
      TUESDAY: t("days.tuesday"),
      WEDNESDAY: t("days.wednesday"),
      THURSDAY: t("days.thursday"),
      FRIDAY: t("days.friday"),
      SATURDAY: t("days.saturday"),
    }),
    [t],
  );

  const TimeSlot = ({ event, isClosed, hourDisplay }: any) => (
    <div
      className={`h-[54px] sm:h-[64px] md:h-[70px] border-b border-gray-100 relative ${
        isClosed ? "bg-gray-100/40 cursor-not-allowed" : "bg-white"
      }`}
    >
      {!isClosed && event && (
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className={`absolute inset-[2px] bg-blue-50 rounded-sm p-1.5 sm:p-2 z-10 shadow-sm overflow-hidden ${
            isRTL
              ? "border-r-4 border-blue-500 text-right"
              : "border-l-4 border-blue-500 text-left"
          }`}
        >
          <div className="text-[7px] sm:text-[9px] text-blue-700 font-bold mb-1 truncate">
            {hourDisplay}
          </div>
          <div className="text-[8px] sm:text-[10px] text-gray-800 font-bold truncate">
            {event.title}
          </div>
          <div className="text-[7px] sm:text-[9px] text-blue-600 truncate">
            {event.service}
          </div>
        </div>
      )}

      {isClosed && (
        <div className="w-full h-full flex items-center justify-center text-gray-400 italic text-[8px] sm:text-[9px] md:text-[10px] px-1 text-center">
          {t("provider.workingHours.closed")}
        </div>
      )}
    </div>
  );

  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const salon = await ServiceProvider.getById();
        if (salon?.workingHours) setWorkingHours(salon.workingHours);

        const appointments =
          await ProviderAppointmentsService.getMyAppointments();

        const formattedEvents = (appointments || []).map((app: any) => {
          const rawDate = app.date || app.services?.[0]?.date;
          const appDate = new Date(rawDate);
          const startTimeStr =
            app.timeSlot?.start || app.services?.[0]?.timeSlot?.start;

          let startHour = -1;
          if (startTimeStr) {
            startHour = parseInt(startTimeStr.split(":")[0]);
          }

          return {
            dateKey: appDate.toDateString(),
            hour: startHour,
            title: app.customerName || "زبون",
            service: app.services?.[0]?.name || "خدمة",
          };
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { globalHours, daysList, eventsMap, selectedDayInfo } = useMemo(() => {
    if (!workingHours?.weekly) {
      return {
        globalHours: [],
        daysList: [],
        eventsMap: new Map(),
        selectedDayInfo: null,
      };
    }

    const dayKeys = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as const;
    let minOpen = 24;
    let maxClose = 0;

    const days = dayKeys.map((key, idx) => {
      const found = workingHours?.weekly?.find((d: any) => d.day === key);
      const d = new Date(selectedDate);
      const diff = idx - selectedDate.getDay();
      d.setDate(selectedDate.getDate() + diff);

      if (found?.isOpen && found.openTime && found.closeTime) {
        const open = parseInt(found.openTime.split(":")[0]);
        const close = parseInt(found.closeTime.split(":")[0]);
        minOpen = Math.min(minOpen, open);
        maxClose = Math.max(maxClose, close);
      }

      return {
        day: key,
        isOpen: found?.isOpen || false,
        openTime: found?.openTime || null,
        closeTime: found?.closeTime || null,
        arName: dayMap[key],
        dateNumber: d.getDate(),
        dateKey: d.toDateString(),
      };
    });

    if (maxClose === 0) {
      minOpen = 9;
      maxClose = 18;
    }

    const hours = Array.from({ length: maxClose - minOpen + 1 }, (_, i) => {
      const h = minOpen + i;
      return {
        value: h,
        label:
          h < 12
            ? `${h}:00 ${t("am")}`
            : h === 12
              ? `12:00 ${t("pm")}`
              : `${h - 12}:00 ${t("pm")}`,
      };
    });

    const map = new Map();
    events.forEach((e) => {
      map.set(`${e.dateKey}-${e.hour}`, e);
    });

    const currentDayData = days.find(
      (d) => d.dateKey === selectedDate.toDateString(),
    );

    return {
      globalHours: hours,
      daysList: days,
      eventsMap: map,
      selectedDayInfo: currentDayData,
    };
  }, [workingHours, events, selectedDate, dayMap, t]);

  if (loading) {
    return (
      <div className="text-center p-8 sm:p-10 font-sans text-sm sm:text-base">
        جاري تحميل البيانات...
      </div>
    );
  }

  return (
    <div
      className="w-full px-3 py-4 sm:p-4 md:p-5 max-w-[1100px] mx-auto rounded-2xl shadow-sm bg-white font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="relative min-w-0">
          <div
            className="flex items-center gap-1 cursor-pointer group min-w-0"
            onClick={() =>
              (
                document.getElementById("calendar-input") as HTMLInputElement
              )?.showPicker()
            }
          >
            <h1 className="text-sm sm:text-lg font-bold text-gray-800 flex items-center gap-2 min-w-0">
              {
                dayMap[
                  Object.keys(dayMap)[
                    selectedDate.getDay()
                  ] as keyof typeof dayMap
                ]
              }{" "}
              ({selectedDate.getDate()}/{selectedDate.getMonth() + 1})
              <ChevronDown
                size={18}
                className="text-gray-400 group-hover:text-gray-700 transition-colors shrink-0"
              />
            </h1>

            <input
              id="calendar-input"
              type="date"
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
              onChange={(e) => {
                if (e.target.value) setSelectedDate(new Date(e.target.value));
              }}
            />
          </div>
          <span className="text-[11px] sm:text-xs text-gray-400 font-medium block mt-1">
            {selectedDayInfo?.isOpen
              ? `${t("provider.workingHours.title")}: ${selectedDayInfo.openTime} - ${selectedDayInfo.closeTime}`
              : t("provider.workingHours.closed")}
          </span>
        </div>
      </div>

      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex justify-between w-full mb-6 sm:mb-8 px-0 sm:px-2 md:px-[70px] gap-1 sm:gap-2"
      >
        {daysList.map((day, idx) => {
          const isSelected = day.dateKey === selectedDate.toDateString();

          let circleStyle = "";

          if (isSelected) {
            circleStyle = "bg-green-700 text-white shadow-lg scale-110 z-10";
          } else if (!day.isOpen) {
            circleStyle = "bg-red-500 text-white hover:bg-red-600";
          } else {
            circleStyle = "bg-green-100 text-green-800 hover:bg-green-200";
          }

          return (
            <div
              key={idx}
              className="flex flex-col items-center flex-1 min-w-0"
            >
              <span
                className={`text-[7px] sm:text-[10px] md:text-[11px] mb-2 font-bold truncate w-full text-center ${
                  isSelected ? "text-green-700" : "text-gray-400"
                }`}
              >
                {day.arName}
              </span>
              <div
                onClick={() => setSelectedDate(new Date(day.dateKey))}
                className={`w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full text-[10px] sm:text-sm font-bold cursor-pointer transition-all duration-200 ${circleStyle}`}
              >
                {day.dateNumber}
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px] md:min-w-[760px] grid grid-cols-[52px_1fr_52px] sm:grid-cols-[60px_1fr_60px] md:grid-cols-[70px_1fr_70px] border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50/50 border-l border-gray-100 flex flex-col">
            {globalHours.map((h) => (
              <div
                key={h.value}
                className="h-[60px] sm:h-[64px] md:h-[70px] border-b border-gray-100 flex items-start justify-center pt-2 sm:pt-3 text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 font-bold px-1 text-center"
              >
                {h.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white">
            {daysList.map((day) => {
              const open = day.openTime ? parseInt(day.openTime) : 0;
              const close = day.closeTime ? parseInt(day.closeTime) : 0;

              return (
                <div
                  key={day.dateKey}
                  className={`border-l border-gray-100 ${
                    day.dateKey === selectedDate.toDateString()
                      ? "bg-green-50/10"
                      : ""
                  }`}
                >
                  {globalHours.map((h) => {
                    const isClosed =
                      !day.isOpen || h.value < open || h.value >= close;
                    const event = eventsMap.get(`${day.dateKey}-${h.value}`);

                    return (
                      <TimeSlot
                        key={h.value}
                        hourDisplay={h.label}
                        isClosed={isClosed}
                        event={event}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50/50 border-r border-gray-100 flex flex-col">
            {globalHours.map((h) => (
              <div
                key={h.value}
                className="h-[60px] sm:h-[64px] md:h-[70px] border-b border-gray-100 flex items-start justify-center pt-2 sm:pt-3 text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 font-bold px-1 text-center"
              >
                {h.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
