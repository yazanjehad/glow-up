"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import BookingSlot from "@/components/booking-slot/BookingSlot";
import type { DayItem, TimeItem } from "../../app/models/booking-slot-types";

import { ProviderSlotsService, ServiceProvider } from "../../integration/services/provider/providerService";
import type { ProviderSlotsDayDto } from "@/app/models/provider-slots";
import { useBookingStore } from "@/store/bookingStore";

type Props = {
  year: number;
  month: number;
  days: DayItem[];
  providerId: string;
  serviceId: string;
  employeeId: string;

  onPickDay?: (dayId: string) => void;
  onPickTime?: (v: { timeId: string; label: string }) => void;
  onMonthYearChange?: (v: { year: number; month: number }) => void;
  disableAutoNavigate?: boolean;
  disabledDateTimes?: { date: string; time: string }[];
};

export default function BookingSlotClient({
  year,
  month,
  days,
  providerId,
  serviceId,
  employeeId,
  onPickDay,
  onPickTime,
  onMonthYearChange,
  disableAutoNavigate,
  disabledDateTimes,
}: Props) {
  const { goToBookingDetails } = useNavigationFlow();

  const [timesByDay, setTimesByDay] = useState<Record<string, TimeItem[]>>({});
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState<any[]>([]);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) return;
      try {
        const provider = await ServiceProvider.getById(providerId);
        setWorkingHours(provider.workingHours?.weekly ?? []);
      } catch (err) {
        console.error("Failed to fetch provider working hours:", err);
      }
    };
    fetchProvider();
  }, [providerId]);

  const localDays = useMemo(() => {
    if (!workingHours.length) return days;
    return days.map(day => {
      const dayName = day.dayKey.toUpperCase();
      const schedule = workingHours.find((w: any) => w.day === dayName);
      if (schedule && !schedule.isOpen) {
        return { ...day, status: "unavailable" as const };
      }
      return day;
    });
  }, [days, workingHours]);

  const setSelectedDate = useBookingStore((s) => s.setSelectedDate);
  const setSelectedTimeSlot = useBookingStore((s) => s.setSelectedTimeSlot);

  const loadDaySlots = async (dayId: string) => {
    if (!providerId || !serviceId || !employeeId || !dayId) return;

    setLoading(true);
    try {
      const data: ProviderSlotsDayDto =
        await ProviderSlotsService.getByProviderId(
          providerId,
          dayId,
          serviceId,
          employeeId
        );

      const times: TimeItem[] = (data?.slots ?? []).map((s: any) => {
        const isOverlap = disabledDateTimes?.some(
          (d) => d.date === dayId && d.time === s.time
        );
        return {
          id: s.time,
          label: s.time,
          status: s.available && !isOverlap ? "available" : ("unavailable" as const),
        };
      });

      setTimesByDay({ [dayId]: data?.isOpen ? times : [] });
    } catch {
      setTimesByDay({ [dayId]: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDayId) loadDaySlots(selectedDayId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayId, providerId, serviceId, employeeId]);

  const handleDayChange = useCallback((value: { dayId: string }) => {
    if (!value.dayId || value.dayId === selectedDayId) return;
    setSelectedDayId(value.dayId);

    onPickDay?.(value.dayId);

    if (!onPickDay) setSelectedDate(value.dayId);
  }, [onPickDay, selectedDayId, setSelectedDate]);

  const handleTimeSelect = (value: { timeId: string }) => {
    const times = timesByDay[selectedDayId] || [];
    const selected = times.find((t) => t.id === value.timeId);
    if (!selected) return;

    onPickTime?.({ timeId: selected.id, label: selected.label });

    if (!onPickTime) {
      setSelectedTimeSlot({ start: selected.label, end: selected.label });
      if (!disableAutoNavigate) goToBookingDetails();
    }
  };

  return (
    <div className={loading ? "opacity-80 pointer-events-none" : ""}>
      <BookingSlot
        year={year}
        month={month}
        days={localDays}
        timesByDay={timesByDay}
        onMonthYearChange={onMonthYearChange}
        onDayChange={handleDayChange}
        onTimeChange={handleTimeSelect}
      />
    </div>
  );
}
