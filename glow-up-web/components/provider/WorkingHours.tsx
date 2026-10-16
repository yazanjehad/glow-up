"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useCustomDialog } from "@/components/ui/custom-dialog";
import EditWorkDayDialog, { WorkDay } from "../ui/editWorkDayDialog";
import { DayKey } from "@/store/providerStore";

interface WorkingHoursProps {
  workingHours: Record<DayKey, WorkDay>;
  updateWorkDay: (day: DayKey, data: WorkDay) => void;
  title?: string;
  subtitle?: string;
  onNext?: () => void;
  onSkip?: () => void;
  isReadOnly?: boolean;
  onDeleteBreak?: (breakId: string) => Promise<void>;
}

const DAYS: { key: DayKey; labelKey: string }[] = [
  { key: "sunday", labelKey: "days.sunday" },
  { key: "monday", labelKey: "days.monday" },
  { key: "tuesday", labelKey: "days.tuesday" },
  { key: "wednesday", labelKey: "days.wednesday" },
  { key: "thursday", labelKey: "days.thursday" },
  { key: "friday", labelKey: "days.friday" },
  { key: "saturday", labelKey: "days.saturday" },
];

export default function WorkingHours({
  workingHours,
  updateWorkDay,
  title,
  subtitle,
  onNext,
  onSkip,
  isReadOnly = false,
  onDeleteBreak,
}: WorkingHoursProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const dialog = useCustomDialog(false);

  const selectedValue = useMemo(() => {
    if (!selectedDay) return null;
    return workingHours[selectedDay];
  }, [selectedDay, workingHours]);

  const toggleDay = (day: DayKey) => {
    if (isReadOnly) return;
    updateWorkDay(day, { ...workingHours[day], open: !workingHours[day].open });
  };

  const openEdit = (day: DayKey) => {
    if (isReadOnly) return;
    setSelectedDay(day);
    dialog.openDialog();
  };

  return (
    <div className="w-full">
      <div className="rounded-[20px] bg-white p-4 sm:p-6 shadow-sm">
        <h1 className="text-center text-lg sm:text-xl font-bold text-gray-900">
          {title || t("provider.workingHours.title")}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          {subtitle || t("provider.workingHours.subtitle")}
        </p>

        <div className="mt-6 space-y-3">
          {DAYS.map(({ key, labelKey }) => {
            const day = workingHours[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-gray-200 px-3 py-3 sm:px-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => toggleDay(key)}
                      className={[
                        "relative h-6 w-11 shrink-0 rounded-full transition",
                        day.open ? "bg-[#7FAE6A]" : "bg-gray-300",
                        isReadOnly ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
                          day.open
                            ? isRTL
                              ? "right-0.5"
                              : "left-5"
                            : isRTL
                              ? "right-5"
                              : "left-0.5",
                        ].join(" ")}
                      />
                    </button>

                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {t(labelKey)}
                    </span>
                  </div>

                  <div
                    className={[
                      "flex w-full sm:w-auto min-w-0",
                      isRTL ? "sm:justify-start" : "sm:justify-end",
                    ].join(" ")}
                  >
                    {!day.open ? (
                      <ClosedBadge text={t("provider.workingHours.closed")} />
                    ) : (
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => openEdit(key)}
                        className={[
                          "flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2 min-w-0",
                          isReadOnly ? "cursor-default" : "",
                        ].join(" ")}
                      >
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {t("provider.workingHours.from")} {day.from}{" "}
                          {t("provider.workingHours.to")} {day.to}
                        </span>

                        {!isReadOnly &&
                          (isRTL ? (
                            <ChevronLeft className="h-4 w-4 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                          ))}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {onNext && (
          <button
            onClick={onNext}
            className="mt-6 h-11 sm:h-12 w-full rounded-xl bg-[#79A66B] text-sm font-semibold text-white"
          >
            {t("provider.common.next")}
          </button>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            className="mt-4 w-full py-3 text-sm font-semibold text-gray-900"
          >
            {t("provider.common.skip")}
          </button>
        )}
      </div>

      <EditWorkDayDialog
        open={dialog.open}
        onOpenChange={(o) => {
          dialog.setOpen(o);
          if (!o) setSelectedDay(null);
        }}
        dayKey={selectedDay}
        value={selectedValue}
        onApply={(next) => {
          updateWorkDay(selectedDay!, next);
          dialog.closeDialog();
        }}
        onRemoveBreak={onDeleteBreak}
      />
    </div>
  );
}

function ClosedBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600 whitespace-nowrap">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500">
        <Clock className="h-3 w-3 text-white" />
      </span>
      <span className="truncate">{text}</span>
    </span>
  );
}
