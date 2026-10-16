"use client";

import { useEffect, useMemo, useState } from "react";
import WorkingHours from "@/components/provider/WorkingHours";
import {
  useProviderStore,
  type DayKey,
  type WorkingHoursSchedule,
  type BreakItem,
} from "@/store/providerStore";
import { Edit2, Save, Plus, Trash2, Clock, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ServiceProvider } from "../../../integration/services/provider/providerService";
import { patch, del } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiWeekDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

type ApiWeeklyItem = {
  day: ApiWeekDay;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type WeeklyBreak = {
  id?: string;
  _id?: string;
  day: ApiWeekDay;
  startTime: string;
  endTime: string;
  reason?: string;
};

type CustomBreak = {
  id?: string;
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
};

const DAY_MAP: Record<ApiWeekDay, DayKey> = {
  SUNDAY: "sunday",
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
};

const REVERSE_DAY_MAP: Record<DayKey, ApiWeekDay> = {
  sunday: "SUNDAY",
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
};

const formatToAmPm = (timeStr: string) => {
  if (!timeStr || !timeStr.includes(":")) return timeStr;
  const [hours, minutes] = timeStr.trim().split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${period}`;
};

const formatRangeToAmPm = (range: string) => {
  if (!range) return "";
  // Handle various separators like "-", " - ", "to"
  const parts = range.split(/[-–]| to /i);
  if (parts.length === 2) {
    return `${formatToAmPm(parts[0])} - ${formatToAmPm(parts[1])}`;
  }
  return range;
};

const translateBackendError = (msg: string, t: any, errorCode?: string) => {
  if (typeof msg !== "string") return msg;

  const normalizedMsg = msg.trim();

  // Pattern for CUSTOM_BREAK_CLOSED_DAY
  if (errorCode === "CUSTOM_BREAK_CLOSED_DAY" || normalizedMsg.includes("CUSTOM_BREAK_CLOSED_DAY") || normalizedMsg.includes("common.days.undefined")) {
    return t("admin-dashboard.validationErrors.closedDayBreak") || "لا يمكن إضافة استراحة في يوم مغلق. يرجى التأكد من أن اليوم مفتوح في جدول المواعيد الإسبوعي.";
  }

  // Pattern for open/close time mismatch
  const openTimeMatch = normalizedMsg.match(
    /openTime must be before closeTime for (.*)/i,
  );
  if (openTimeMatch) {
    const dayName = openTimeMatch[1].trim().toUpperCase();
    const dayKey = dayName.toLowerCase();
    return t("admin-dashboard.validationErrors.openTimeBeforeCloseTime", {
      day: t(`days.${dayKey}`) || dayName,
    });
  }

  // Handle overlap errors (very flexible)
  // Supports: "Break overlaps...", "Custom break overlaps...", "الاستراحة تتداخل..."
  // Also handles if day is present or missing before the time range
  const isOverlap =
    normalizedMsg.toLowerCase().includes("overlap") ||
    normalizedMsg.includes("تتداخل");

  if (isOverlap) {
    // Extract range if exists: (HH:mm-HH:mm)
    const rangeMatch = normalizedMsg.match(/\((.*?)\)/);
    const range = rangeMatch ? rangeMatch[1] : "";

    // Extract day if exists: "on MONDAY" or "يوم الاثنين"
    let day = "";
    const dayMatch = normalizedMsg.match(/on\s+([^\s(]+)/i);
    if (dayMatch) {
      const dayKey = dayMatch[1].trim().toLowerCase();
      day = t(`days.${dayKey}`) || dayMatch[1];
    }

    return t("admin-dashboard.validationErrors.breakOverlap", {
      day: day,
      range: formatRangeToAmPm(range),
    })
      .replace(/\(\s*\)/g, "")
      .replace(/^\s*يوم\s+/, "")
      .trim();
  }

  // Pattern: Past date error
  const isPastError =
    normalizedMsg.toLowerCase().includes("cannot be in the past") ||
    normalizedMsg.includes("في الماضي");

  if (isPastError) {
    return t("admin-dashboard.validationErrors.cannotBeInPast");
  }

  if (normalizedMsg === "Failed to save working hours") {
    return t("admin-dashboard.validationErrors.failedToSave");
  }

  return msg;
};

const DEFAULT_SCHEDULE: WorkingHoursSchedule = {
  sunday: { open: false, from: "10:00", to: "18:00" },
  monday: { open: true, from: "10:00", to: "18:00" },
  tuesday: { open: true, from: "10:00", to: "18:00" },
  wednesday: { open: true, from: "10:00", to: "18:00" },
  thursday: { open: true, from: "10:00", to: "18:00" },
  friday: { open: true, from: "10:00", to: "18:00" },
  saturday: { open: false, from: "10:00", to: "18:00" },
};

function mapWeeklyToSchedule(
  weekly: ApiWeeklyItem[] | undefined,
  weeklyBreaks: WeeklyBreak[] | undefined,
  fallback: WorkingHoursSchedule,
): WorkingHoursSchedule {
  const next: WorkingHoursSchedule = { ...fallback };

  (weekly ?? []).forEach((w) => {
    const key = DAY_MAP[w.day];
    if (!key) return;

    const dayBreaks = (weeklyBreaks ?? [])
      .filter((b) => b.day === w.day)
      .map(
        (b): BreakItem => ({
          id: b.id || b._id,
          _id: b._id || b.id,
          from: b.startTime,
          to: b.endTime,
        }),
      );

    next[key] = {
      open: !!w.isOpen,
      from: w.openTime || fallback[key].from,
      to: w.closeTime || fallback[key].to,
      breaks: dayBreaks.length > 0 ? dayBreaks : undefined,
    };
  });

  return next;
}

function scheduleToApiWeekly(schedule: WorkingHoursSchedule): ApiWeeklyItem[] {
  const days: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days.map((d) => {
    const v = schedule[d];
    return {
      day: REVERSE_DAY_MAP[d],
      isOpen: !!v.open,
      openTime: (v.from || "10:00").trim(),
      closeTime: (v.to || "18:00").trim(),
    };
  });
}

function scheduleToWeeklyBreaks(schedule: WorkingHoursSchedule): WeeklyBreak[] {
  const days: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const breaks: WeeklyBreak[] = [];

  days.forEach((d) => {
    const v = schedule[d];
    if (v.breaks && v.breaks.length > 0) {
      v.breaks.forEach((b) => {
        breaks.push({
          id: b.id || b._id,
          _id: b._id || b.id,
          day: REVERSE_DAY_MAP[d],
          startTime: b.from,
          endTime: b.to,
          reason: "Break",
        });
      });
    }
  });
  return breaks;
}

function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function SalonSettings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [activeTab, setActiveTab] = useState<"working-hours" | "custom-breaks">(
    "working-hours",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const workingHours = useProviderStore((s) => s.workingHours);
  const setWorkingHours = useProviderStore((s) => s.setWorkingHours);
  const updateWorkDay = useProviderStore((s) => s.updateWorkDay);

  const fallback = useMemo(() => DEFAULT_SCHEDULE, []);

  const [originalSchedule, setOriginalSchedule] =
    useState<WorkingHoursSchedule>(fallback);
  const [timezone, setTimezone] = useState<string>("Asia/Amman");

  const [customBreaks, setCustomBreaks] = useState<CustomBreak[]>([]);
  const [originalCustomBreaks, setOriginalCustomBreaks] = useState<
    CustomBreak[]
  >([]);

  const [newCustomBreak, setNewCustomBreak] = useState<Partial<CustomBreak>>({
    date: "",
    startTime: "13:00",
    endTime: "14:00",
    reason: "",
  });

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const provider: any = await ServiceProvider.getMe();

        const weekly = (provider?.workingHours?.weekly ??
          []) as ApiWeeklyItem[];
        const tz = (provider?.workingHours?.timezone || "Asia/Amman") as string;
        const apiWeeklyBreaks = (provider?.workingHours?.breaks?.weekly ??
          []) as WeeklyBreak[];
        const apiCustomBreaks = (provider?.workingHours?.breaks?.custom ??
          []) as CustomBreak[];

        const mapped = mapWeeklyToSchedule(weekly, apiWeeklyBreaks, fallback);

        if (!alive) return;

        setTimezone(tz);
        setWorkingHours(mapped);
        setOriginalSchedule(mapped);
        setCustomBreaks(apiCustomBreaks);
        setOriginalCustomBreaks(apiCustomBreaks);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load working hours";
        if (alive)
          setLoadError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [setWorkingHours, fallback]);

  const handleToggleEditOrSave = async () => {
    // دخول وضع التعديل
    if (!isEditing) {
      setSaveError("");
      setIsEditing(true);
      return;
    }

    try {
      setSaving(true);
      setSaveError("");

      const token = localStorage.getItem(TOKEN_KEY);

      const hasScheduleChanges =
        JSON.stringify(workingHours) !== JSON.stringify(originalSchedule);
      const hasCustomBreakChanges =
        JSON.stringify(customBreaks) !== JSON.stringify(originalCustomBreaks);

      if (!hasScheduleChanges && !hasCustomBreakChanges) {
        setIsEditing(false);
        return;
      }

      const weeklyPayload = scheduleToApiWeekly(workingHours);
      const weeklyBreaksPayload = scheduleToWeeklyBreaks(workingHours);

      const customBreaksPayload = customBreaks.map((b) => {
        // Ensure date is in YYYY-MM-DD format to avoid backend parsing issues
        // When loaded from API, it might be an ISO string "2026-05-06T00:00:00.000Z"
        const cleanDate = b.date.includes("T") ? b.date.split("T")[0] : b.date;

        const payload: any = {
          date: cleanDate,
          startTime: b.startTime,
          endTime: b.endTime,
          reason: b.reason || "",
        };

        // Only include id/_id if it's not a temporary ID (doesn't start with "temp_")
        const breakId = b._id || b.id;
        if (breakId && !breakId.startsWith("temp_")) {
          payload._id = breakId;
        }

        return payload;
      });

      const providerId = localStorage.getItem("providerId");
      if (!providerId) throw new Error("Missing providerId");

      const res = await patch(
        `/providers/${providerId}`,
        {
          workingHours: {
            timezone,
            weekly: weeklyPayload,
            breaks: {
              weekly: weeklyBreaksPayload,
              custom: customBreaksPayload,
            },
          },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      const updated = res.data as any;
      const updatedWeekly = (updated?.workingHours?.weekly ??
        weeklyPayload) as ApiWeeklyItem[];
      const updatedTz = (updated?.workingHours?.timezone || timezone) as string;
      const updatedWeeklyBreaks = (updated?.workingHours?.breaks?.weekly ??
        []) as WeeklyBreak[];
      const updatedCustomBreaks = (updated?.workingHours?.breaks?.custom ??
        customBreaks) as CustomBreak[];

      const mappedBack = mapWeeklyToSchedule(
        updatedWeekly,
        updatedWeeklyBreaks,
        workingHours,
      );

      setTimezone(updatedTz);
      setWorkingHours(mappedBack);
      setOriginalSchedule(mappedBack);
      setCustomBreaks(updatedCustomBreaks);
      setOriginalCustomBreaks(updatedCustomBreaks);

      setIsEditing(false);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to save working hours";
      const errorCode = e?.response?.data?.errorCode;

      const translatedMsg = translateBackendError(msg, t, errorCode);
      setSaveError(
        typeof translatedMsg === "string"
          ? translatedMsg
          : JSON.stringify(translatedMsg),
      );
    } finally {
      setSaving(false);
    }
  };

  const addCustomBreak = () => {
    if (
      !newCustomBreak.date ||
      !newCustomBreak.startTime ||
      !newCustomBreak.endTime
    )
      return;
    const newBreak: CustomBreak = {
      id: generateTempId(),
      date: newCustomBreak.date,
      startTime: newCustomBreak.startTime,
      endTime: newCustomBreak.endTime,
      reason: newCustomBreak.reason || "",
    };
    setCustomBreaks([...customBreaks, newBreak]);
    setNewCustomBreak({
      date: "",
      startTime: "13:00",
      endTime: "14:00",
      reason: "",
    });
  };


  const removeCustomBreak = async (breakId: string) => {
    const breakToRemove = customBreaks.find((b) => (b._id || b.id) == breakId);
    if (!breakToRemove) return;

    // Server breaks have _id from MongoDB, temp breaks have id starting with "temp_"
    const serverBreakId = breakToRemove._id || breakToRemove.id;
    const isServerBreak = serverBreakId && !serverBreakId.startsWith("temp_");

    if (isServerBreak) {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const breakType = breakToRemove.date ? "custom" : "weekly";
        await del(`/providers/breaks/${serverBreakId}?type=${breakType}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (e: any) {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to delete break";
        setSaveError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
    }

    setCustomBreaks(customBreaks.filter((b) => (b._id || b.id) !== breakId));
  };

  const deleteWeeklyBreak = async (breakId: string) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await del(`/providers/breaks/${breakId}?type=weekly`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to delete break";
      setSaveError(typeof msg === "string" ? msg : JSON.stringify(msg));
      throw e;
    }
  };

  const updateCustomBreakField = (
    breakId: string,
    field: keyof CustomBreak,
    value: string,
  ) => {
    setCustomBreaks(
      customBreaks.map((b) =>
        (b._id || b.id) === breakId ? { ...b, [field]: value } : b,
      ),
    );
  };

  const handleCancel = () => {
    setWorkingHours(originalSchedule);
    setCustomBreaks(originalCustomBreaks);
    setIsEditing(false);
    setSaveError("");
  };

  return (
    <div className="px-3 py-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6 max-w-2xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          {t("admin-dashboard.workingHoursManagement")}
        </h2>

        <button
          onClick={handleToggleEditOrSave}
          disabled={saving || loading}
          className={[
            "flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-2 rounded-xl text-sm font-bold transition w-full sm:w-auto",
            isEditing
              ? "bg-[#79A66B] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            saving ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />{" "}
              {saving
                ? t("admin-dashboard.saving")
                : t("admin-dashboard.finishEditing")}
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" /> {t("admin-dashboard.updateHours")}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="flex flex-col sm:flex-row gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("working-hours")}
            className={[
              "flex-1 py-2.5 sm:py-2 px-4 rounded-lg text-sm font-medium transition",
              activeTab === "working-hours"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            <Clock className="inline-block h-4 w-4 mr-2" />
            {t("admin-dashboard.workingHours") || "Working Hours"}
          </button>
          <button
            onClick={() => setActiveTab("custom-breaks")}
            className={[
              "flex-1 py-2.5 sm:py-2 px-4 rounded-lg text-sm font-medium transition",
              activeTab === "custom-breaks"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            ].join(" ")}
          >
            <Calendar className="inline-block h-4 w-4 mr-2" />
            {t("admin-dashboard.customBreaks") || "Custom Breaks"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="rounded-[20px] bg-white p-5 sm:p-6 border border-gray-100 text-center text-sm sm:text-base">
            {t("loading") || "Loading..."}
          </div>
        ) : loadError ? (
          <div className="rounded-[20px] bg-white p-5 sm:p-6 border border-gray-100">
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        ) : activeTab === "working-hours" ? (
          <>
            <WorkingHours
              workingHours={workingHours}
              updateWorkDay={updateWorkDay}
              isReadOnly={!isEditing || saving}
              title={t("provider.workingHours.title")}
              onDeleteBreak={deleteWeeklyBreak}
            />

            {saveError && (
              <div className="mt-4 rounded-[16px] bg-white p-4 border border-red-100">
                <p className="text-sm text-red-600">{saveError}</p>
              </div>
            )}

            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={saving}
                className="mt-4 h-11 sm:h-12 w-full rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                {t("cancel")}
              </button>
            )}
          </>
        ) : (
          /* Custom Breaks Tab */
          <div
            dir={isRTL ? "rtl" : "ltr"}
            className="rounded-[20px] bg-white p-4 sm:p-6 shadow-sm"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              {t("admin-dashboard.customBreaks") || "Custom Breaks"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t("admin-dashboard.customBreaksDescription") ||
                "Add breaks for specific dates (e.g., holidays, special events)"}
            </p>

            {/* Add New Custom Break Form */}
            {isEditing && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {t("admin-dashboard.addCustomBreak") || "Add Custom Break"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1.5 font-medium px-1">
                      {t("admin-dashboard.date") || "Date"}
                    </label>
                    <div
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        const input = e.currentTarget.querySelector("input");
                        if (input && "showPicker" in input) input.showPicker();
                      }}
                    >
                      <Input
                        type="date"
                        value={newCustomBreak.date || ""}
                        onChange={(e) =>
                          setNewCustomBreak({
                            ...newCustomBreak,
                            date: e.target.value,
                          })
                        }
                        className={[
                          "h-10 rounded-xl bg-white border-gray-200 transition-all group-hover:border-[#79A66B] hide-native-icon text-sm",
                          isRTL ? "pr-10" : "pl-10",
                        ].join(" ")}
                      />
                      <Calendar
                        className={[
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#79A66B] transition-colors",
                          isRTL ? "right-3.5" : "left-3.5",
                        ].join(" ")}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1.5 font-medium px-1">
                      {t("admin-dashboard.reason") || "Reason"}
                    </label>
                    <Input
                      type="text"
                      value={newCustomBreak.reason || ""}
                      onChange={(e) =>
                        setNewCustomBreak({
                          ...newCustomBreak,
                          reason: e.target.value,
                        })
                      }
                      placeholder={
                        t("admin-dashboard.reasonPlaceholder") ||
                        "e.g., Holiday"
                      }
                      className="h-10 rounded-xl bg-white border-gray-200 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1.5 font-medium px-1">
                      {t("admin-dashboard.startTime") || "Start Time"}
                    </label>
                    <div
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        const input = e.currentTarget.querySelector("input");
                        if (input && "showPicker" in input) input.showPicker();
                      }}
                    >
                      <Input
                        type="time"
                        value={newCustomBreak.startTime || ""}
                        onChange={(e) =>
                          setNewCustomBreak({
                            ...newCustomBreak,
                            startTime: e.target.value,
                          })
                        }
                        className={[
                          "h-10 rounded-xl bg-white border-gray-200 transition-all group-hover:border-[#79A66B] hide-native-icon text-sm",
                          isRTL ? "pr-10" : "pl-10",
                        ].join(" ")}
                      />
                      <Clock
                        className={[
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#79A66B] transition-colors",
                          isRTL ? "right-3.5" : "left-3.5",
                        ].join(" ")}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1.5 font-medium px-1">
                      {t("admin-dashboard.endTime") || "End Time"}
                    </label>
                    <div
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        const input = e.currentTarget.querySelector("input");
                        if (input && "showPicker" in input) input.showPicker();
                      }}
                    >
                      <Input
                        type="time"
                        value={newCustomBreak.endTime || ""}
                        onChange={(e) =>
                          setNewCustomBreak({
                            ...newCustomBreak,
                            endTime: e.target.value,
                          })
                        }
                        className={[
                          "h-10 rounded-xl bg-white border-gray-200 transition-all group-hover:border-[#79A66B] hide-native-icon text-sm",
                          isRTL ? "pr-10" : "pl-10",
                        ].join(" ")}
                      />
                      <Clock
                        className={[
                          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#79A66B] transition-colors",
                          isRTL ? "right-3.5" : "left-3.5",
                        ].join(" ")}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={addCustomBreak}
                  disabled={!newCustomBreak.date}
                  className="w-full h-10 bg-[#79A66B] hover:bg-[#6a9460] rounded-xl text-white font-bold text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin-dashboard.addBreak") || "Add Break"}
                </Button>
              </div>
            )}

            {/* Custom Breaks List */}
            {customBreaks.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                {t("admin-dashboard.noCustomBreaks") ||
                  "No custom breaks scheduled"}
              </p>
            ) : (
              <div className="space-y-3">
                {customBreaks.map((breakItem) => {
                  const breakId = breakItem._id || breakItem.id || "";
                  return (
                    <div
                      key={breakId}
                      className="flex flex-col lg:flex-row lg:items-center gap-3 bg-gray-50 rounded-lg p-3"
                    >
                      {isEditing ? (
                        <>
                          <div
                            className="relative group cursor-pointer shrink-0 w-full sm:w-auto"
                            onClick={(e) => {
                              const input =
                                e.currentTarget.querySelector("input");
                              if (input && "showPicker" in input)
                                input.showPicker();
                            }}
                          >
                            <Input
                              type="date"
                              value={
                                breakItem.date?.split("T")[0] || breakItem.date
                              }
                              onChange={(e) =>
                                updateCustomBreakField(
                                  breakId,
                                  "date",
                                  e.target.value,
                                )
                              }
                              className={[
                                "h-10 w-full sm:w-40 text-sm rounded-xl transition-all group-hover:border-[#79A66B] hide-native-icon",
                                isRTL ? "pr-10" : "pl-10",
                              ].join(" ")}
                            />
                            <Calendar
                              className={[
                                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#79A66B] transition-colors",
                                isRTL ? "right-3" : "left-3",
                              ].join(" ")}
                            />
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div
                              className="relative group cursor-pointer shrink-0 flex-1 sm:flex-none"
                              onClick={(e) => {
                                const input =
                                  e.currentTarget.querySelector("input");
                                if (input && "showPicker" in input)
                                  input.showPicker();
                              }}
                            >
                              <Input
                                type="time"
                                value={breakItem.startTime}
                                onChange={(e) =>
                                  updateCustomBreakField(
                                    breakId,
                                    "startTime",
                                    e.target.value,
                                  )
                                }
                                className={[
                                  "h-10 w-full sm:w-28 text-sm rounded-xl transition-all group-hover:border-[#79A66B] hide-native-icon",
                                  isRTL ? "pr-10" : "pl-10",
                                ].join(" ")}
                              />
                              <Clock
                                className={[
                                  "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#79A66B] transition-colors",
                                  isRTL ? "right-3" : "left-3",
                                ].join(" ")}
                              />
                            </div>

                            <span className="text-gray-300 shrink-0">-</span>

                            <div
                              className="relative group cursor-pointer shrink-0 flex-1 sm:flex-none"
                              onClick={(e) => {
                                const input =
                                  e.currentTarget.querySelector("input");
                                if (input && "showPicker" in input)
                                  input.showPicker();
                              }}
                            >
                              <Input
                                type="time"
                                value={breakItem.endTime}
                                onChange={(e) =>
                                  updateCustomBreakField(
                                    breakId,
                                    "endTime",
                                    e.target.value,
                                  )
                                }
                                className={[
                                  "h-10 w-full sm:w-28 text-sm rounded-xl transition-all group-hover:border-[#79A66B] hide-native-icon",
                                  isRTL ? "pr-10" : "pl-10",
                                ].join(" ")}
                              />
                              <Clock
                                className={[
                                  "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#79A66B] transition-colors",
                                  isRTL ? "right-3" : "left-3",
                                ].join(" ")}
                              />
                            </div>
                          </div>

                          <Input
                            type="text"
                            value={breakItem.reason || ""}
                            onChange={(e) =>
                              updateCustomBreakField(
                                breakId,
                                "reason",
                                e.target.value,
                              )
                            }
                            placeholder={
                              t("admin-dashboard.reason") || "Reason"
                            }
                            className="h-10 min-w-0 w-full flex-1 text-sm rounded-xl border-gray-200"
                          />

                          <button
                            onClick={() => removeCustomBreak(breakId)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition self-end lg:self-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {breakItem.date?.split("T")[0] || breakItem.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-500 break-words">
                              {breakItem.startTime} - {breakItem.endTime}
                              {breakItem.reason && ` • ${breakItem.reason}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {saveError && (
              <div className="mt-4 rounded-[16px] bg-white p-4 border border-red-100">
                <p className="text-sm text-red-600">{saveError}</p>
              </div>
            )}

            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={saving}
                className="mt-4 h-11 sm:h-12 w-full rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                {t("common.cancel") || "Cancel"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
