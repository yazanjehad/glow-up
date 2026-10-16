"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { employeesServices } from "@/integration/services/employees/employees.service";
import type { EmployeeDto } from "@/integration/services/employees/employees.types";

import EmployeeCard from "@/components/team/EmployeeCard";
import BookingSlotClient from "@/components/booking-slot/BookingSlotClient";

export const ANY_EMPLOYEE_ID = "any";
import type { DayItem } from "@/app/models/booking-slot-types";
import type { TimeSlot } from "@/app/models/multi-booking.types";

function buildImageUrl(path?: string): string {
  if (!path) return "";
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }
  return `https://api-staging.theglowhub.com.sa/files/public?path=${encodeURIComponent(cleanPath)}`;
}

function AnyEmployeeCard({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        gap-2
        w-32 h-36
        px-4 py-4
        rounded-[20px]
        border
        transition-all duration-300
        cursor-pointer
        ${isActive ? "bg-[#edf4e9] border-[#92b382] shadow-sm" : "bg-white border-[#E0E0E0]"}
      `}
    >
      <div
        className={`
          w-[60px] h-[60px] rounded-full flex items-center justify-center
          ${isActive ? "bg-[#92b382] text-white" : "bg-gray-200 text-gray-500"}
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <span
        className={`text-sm font-bold text-center ${isActive ? "text-black" : "text-gray-400"}`}
      >
        {t("anySpecialist")}
      </span>
    </div>
  );
}

type Props = {
  serviceName?: string;
  providerId: string;
  serviceId: string;
  year: number;
  month: number;
  days: DayItem[];
  selectedEmployeeId: string;
  selectedDate: string;
  selectedTime: string;
  disabledDateTimes?: { date: string; time: string }[];
  onMonthYearChange?: (v: { year: number; month: number }) => void;
  onPickEmployee: (id: string) => void;
  onPickDay: (d: string) => void;
  onPickTime: (slot: TimeSlot) => void;
  onClear: () => void;
};

export default function MultiServiceStepCard({
  serviceName,
  providerId,
  serviceId,
  year,
  month,
  days,
  selectedEmployeeId,
  selectedDate,
  selectedTime,
  disabledDateTimes,
  onMonthYearChange,
  onPickEmployee,
  onPickDay,
  onPickTime,
  onClear,
}: Props) {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId || !serviceId) return;

    setLoading(true);
    setError(null);

    employeesServices
      .listByProviderByService(providerId, serviceId)
      .then(setEmployees)
      .catch(() => {
        setError("loadFailed");
        setEmployees([]);
      })
      .finally(() => setLoading(false));
  }, [providerId, serviceId]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border space-y-3">
      <div className="font-semibold text-sm">
        {serviceName ?? "—"}
      </div>

      {loading && (
        <div className="text-center py-8 text-sm text-gray-500">
          {t("bookingMulti.loadingEmployees")}
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-sm text-red-500">
          {t("bookingMulti.loadEmployeesFailed")}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-wrap gap-3 justify-center">
          <AnyEmployeeCard
            isActive={selectedEmployeeId === ANY_EMPLOYEE_ID}
            onClick={() => onPickEmployee(ANY_EMPLOYEE_ID)}
          />
          {employees.map((e) => (
            <EmployeeCard
              key={e.id}
              name={e.name}
              rating="—"
              reviewsCount="0"
              imageUrl={buildImageUrl(e.profileImage)}
              isActive={selectedEmployeeId === e.id}
              onClick={() => onPickEmployee(e.id)}
              className="w-32 h-36"
            />
          ))}
        </div>
      )}

      {selectedEmployeeId && selectedEmployeeId !== "" && (
        <BookingSlotClient
          year={year}
          month={month}
          days={days}
          providerId={providerId}
          serviceId={serviceId}
          employeeId={selectedEmployeeId}
          disableAutoNavigate
          disabledDateTimes={disabledDateTimes}
          onMonthYearChange={onMonthYearChange}
          onPickDay={onPickDay}
          onPickTime={(v: { label: string }) =>
            onPickTime({ start: v.label, end: v.label })
          }
        />
      )}
    </div>
  );
}
