"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import CustomDialog from "@/components/ui/custom-dialog";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";

export type BreakItem = { id?: string; _id?: string; from: string; to: string };
export type WorkDay = {
  open: boolean;
  from: string;
  to: string;
  breaks?: BreakItem[];
};

type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

const DAY_LABEL_KEYS: Record<DayKey, string> = {
  sunday: "days.sunday",
  monday: "days.monday",
  tuesday: "days.tuesday",
  wednesday: "days.wednesday",
  thursday: "days.thursday",
  friday: "days.friday",
  saturday: "days.saturday",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayKey: DayKey | null;
  value: WorkDay | null;
  onApply: (next: WorkDay) => void;
  onRemoveBreak?: (breakId: string) => Promise<void>;
}

export default function EditWorkDayDialog({
  open,
  onOpenChange,
  dayKey,
  value,
  onApply,
  onRemoveBreak,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("12:00");
  const [breaks, setBreaks] = useState<BreakItem[]>([]);
  const [timeError, setTimeError] = useState("");
  const [breakError, setBreakError] = useState("");

  useEffect(() => {
    if (value) {
      setFrom(value.from);
      setTo(value.to);
      setBreaks(value.breaks ?? []);
      setTimeError("");
      setBreakError("");
    }
  }, [value, open]);

  const addBreak = () => setBreaks([...breaks, { from: "14:00", to: "15:00" }]);

  const removeBreak = async (idx: number) => {
    const br = breaks[idx];
    const breakId = br._id || br.id;
    if (breakId && !breakId.startsWith("temp_") && onRemoveBreak) {
      try {
        await onRemoveBreak(breakId);
      } catch (err) {
        console.error("Failed to delete break", err);
        return;
      }
    }
    setBreaks(breaks.filter((_, i) => i !== idx));
  };

  const updateBreak = (idx: number, patch: Partial<BreakItem>) => {
    setBreaks(breaks.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleApply = () => {
    if (!value) return;

    setTimeError("");
    setBreakError("");

    if (toMinutes(from) >= toMinutes(to)) {
      setTimeError(t("provider.workingHours.invalidWorkHours"));
      return;
    }

    for (const br of breaks) {
      if (toMinutes(br.from) >= toMinutes(br.to)) {
        setBreakError(t("provider.workingHours.invalidBreakHours"));
        return;
      }

      if (
        toMinutes(br.from) < toMinutes(from) ||
        toMinutes(br.to) > toMinutes(to)
      ) {
        setBreakError(t("provider.workingHours.breakOutsideWorkHours"));
        return;
      }
    }

    const breakKeys = breaks.map((br) => `${br.from}-${br.to}`);
    const uniqueBreakKeys = new Set(breakKeys);

    if (uniqueBreakKeys.size !== breakKeys.length) {
      setBreakError(t("provider.workingHours.duplicateBreakHours"));
      return;
    }

    onApply({
      open: value.open,
      from,
      to,
      breaks,
    });
  };

  return (
    <CustomDialog title="" open={open} onOpenChange={onOpenChange}>
      {!dayKey || !value ? null : (
        <div className="space-y-6">
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => onOpenChange(false)}
              className={["absolute p-2", isRTL ? "left-0" : "right-0"].join(
                " ",
              )}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
            <span className="text-base font-semibold">
              {t(DAY_LABEL_KEYS[dayKey])}
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold">
              {t("provider.workingHour.workHours")}
            </span>

            <div className="grid grid-cols-2 gap-4">
              <TimeField
                label={t("provider.workingHours.from")}
                value={from}
                onChange={setFrom}
                isRTL={isRTL}
              />
              <TimeField
                label={t("provider.workingHours.to")}
                value={to}
                onChange={setTo}
                isRTL={isRTL}
              />
            </div>

            {timeError && (
              <p
                className={[
                  "text-sm text-red-500",
                  isRTL ? "text-right" : "text-left",
                ].join(" ")}
              >
                {timeError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div
              className={[
                "flex items-center justify-between",
                isRTL ? "flex-row-reverse" : "",
              ].join(" ")}
            >
              <span className="text-sm font-semibold">
                {t("provider.workingHours.addBreaks")}
              </span>
              <button
                onClick={addBreak}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {breaks.map((b, idx) => (
              <div key={idx} className="flex items-end gap-3">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <TimeField
                    label={t("provider.workingHours.from")}
                    value={b.from}
                    onChange={(v) => updateBreak(idx, { from: v })}
                    isRTL={isRTL}
                  />
                  <TimeField
                    label={t("provider.workingHours.to")}
                    value={b.to}
                    onChange={(v) => updateBreak(idx, { to: v })}
                    isRTL={isRTL}
                  />
                </div>
                <button
                  onClick={() => removeBreak(idx)}
                  className="p-2 mb-1 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}

            {breakError && (
              <p
                className={[
                  "text-sm text-red-500",
                  isRTL ? "text-right" : "text-left",
                ].join(" ")}
              >
                {breakError}
              </p>
            )}
          </div>

          <button
            onClick={handleApply}
            className="h-12 w-full rounded-xl bg-[#79A66B] font-semibold text-white"
          >
            {t("provider.common.apply")}
          </button>
        </div>
      )}
    </CustomDialog>
  );
}

function TimeField({
  label,
  value,
  onChange,
  isRTL,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    if (inputRef.current) {
      if ("showPicker" in HTMLInputElement.prototype) {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none",
            isRTL ? "text-right" : "text-left",
          ].join(" ")}
        />
        <div
          onClick={handleIconClick}
          className={[
            "absolute top-1/2 -translate-y-1/2 cursor-pointer p-2",
            isRTL ? "left-1" : "right-1",
          ].join(" ")}
        >
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
