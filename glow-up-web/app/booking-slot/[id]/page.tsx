
"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import BookingSlotClient from "@/components/booking-slot/BookingSlotClient";
import type { DayItem } from "../../models/booking-slot-types";
import { useBookingStore } from "@/store/bookingStore";
const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

function buildMonthDays(year: number, month1to12: number): DayItem[] {
  const total = daysInMonth(year, month1to12);
  const res: DayItem[] = [];

  for (let d = 1; d <= total; d++) {
    const dt = new Date(Date.UTC(year, month1to12 - 1, d));
    const dayKey = WEEKDAY_KEYS[dt.getUTCDay()];

    res.push({
      id: `${year}-${String(month1to12).padStart(2, "0")}-${String(d).padStart(2, "0")}`, // YYYY-MM-DD
      dayKey,
      date: d,
      status: "available",
    });
  }

  return res;
}

export default function BookingSlotPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const days = useMemo(() => buildMonthDays(year, month), [year, month]);

  const { selectedEmployeeID, selectedServiceID, selectedProviderID, hasHydrated } = useBookingStore();

  // Redirect to home if required booking state is missing (e.g., page refresh)
  useEffect(() => {
    if (hasHydrated && (!selectedProviderID || !selectedServiceID || !selectedEmployeeID)) {
      router.replace("/home");
    }
  }, [selectedProviderID, selectedServiceID, selectedEmployeeID, router, hasHydrated]);


  const handleMonthYearChange = ({ year: newYear, month: newMonth }: { year: number; month: number }) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-56px)] bg-gray-50 flex justify-center">
        <div className="bookslot">
          <TopBar
            titleKey="bookingSlot.title"
            iconAriaLabelKey="bookingSlot.backAria"
            icon={<ChevronArrow />}
          />

          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <BookingSlotClient
                year={year}
                month={month}
                days={days}
                providerId={selectedProviderID}
                serviceId={selectedServiceID}
                employeeId={selectedEmployeeID}
                onMonthYearChange={handleMonthYearChange}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
