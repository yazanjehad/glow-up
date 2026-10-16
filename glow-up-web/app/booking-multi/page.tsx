"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { useSearchParams, useRouter } from "next/navigation";

import { useServicesStore } from "@/store/serviceStore";
import { useBookingStore } from "@/store/bookingStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";

import MultiServiceStepCard from "@/components/booking-multi/MultiServiceStepCard";
import type { DayItem } from "@/app/models/booking-slot-types";

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function buildMonthDays(year: number, month: number): DayItem[] {
  const total = new Date(year, month, 0).getDate();
  return Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    const dt = new Date(Date.UTC(year, month - 1, d));
    return {
      id: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      dayKey: WEEKDAY_KEYS[dt.getUTCDay()],
      date: d,
      status: "available",
    };
  });
}

export default function BookingMultiPage() {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const router = useRouter();

  const providerIdFromUrl = sp?.get("id") ?? "";
  const { selectedProviderID, providerServices, hasHydrated: bookingHasHydrated } = useBookingStore();
  const { servicesIDS: serviceIds, hasHydrated: servicesHasHydrated } = useServicesStore();

  const providerId = providerIdFromUrl || selectedProviderID;

  // Redirect to home if no provider or services selected (e.g., page refresh)
  useEffect(() => {
    if (bookingHasHydrated && servicesHasHydrated) {
      if (!providerId || !serviceIds.length) {
        router.replace("/home");
      }
    }
  }, [providerId, serviceIds.length, router, bookingHasHydrated, servicesHasHydrated]);


  const validServiceIds = useMemo(
    () =>
      serviceIds.filter((sid) =>
        providerServices.some((s: { id?: string }) => String(s?.id) === String(sid)),
      ),
    [serviceIds, providerServices],
  );

  const {
    items,
    initFromServiceIds,
    setEmployee,
    setDate,
    setTimeSlot,
    clearItem,
  } = useMultiBookingStore();

  const [currentStep, setCurrentStep] = useState(0);

  const handleGoToPayment = () => {
    router.push("/booking-details?mode=multi");
  };

  useEffect(() => {
    if (providerId && validServiceIds.length) {
      initFromServiceIds(providerId, validServiceIds);
    }
  }, [providerId, validServiceIds, initFromServiceIds]);

  const serviceNameById = useMemo(() => {
    const map = new Map<string, string>();
    providerServices.forEach((s: any) => {
      map.set(String(s.id), s.name);
    });
    return map;
  }, [providerServices]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const days = useMemo(() => buildMonthDays(year, month), [year, month]);

  const handleMonthYearChange = ({ year: y, month: m }: { year: number; month: number }) => {
    setYear(y);
    setMonth(m);
  };

  const totalSteps = items.length;
  const currentItem = items[currentStep];

  const isCurrentStepComplete =
    currentItem?.employeeId && currentItem?.date && currentItem?.timeSlot.start;

  const isAllComplete = items.every(
    (it) => it.employeeId && it.date && it.timeSlot.start,
  );

  const canGoNext = currentStep < totalSteps - 1 && isCurrentStepComplete;
  const canGoPrev = currentStep > 0;
  const isLastStep = currentStep === totalSteps - 1;

  if (!currentItem) {
    return (
      <Layout>
        <TopBar
          titleKey="bookingMulti.title"
          iconAriaLabelKey="bookingSlot.backAria"
          icon={<ChevronArrow />}
          iconHref={`/salon/${providerId}`}
        />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
          {t("bookingMulti.noServices")}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TopBar
        titleKey="bookingMulti.title"
        iconAriaLabelKey="bookingSlot.backAria"
        icon={<ChevronArrow />}
        iconHref={`/salon/${providerId}`}
      />

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              {t("bookingMulti.serviceProgress", { current: currentStep + 1, total: totalSteps })}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#7BAE6A] h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-4">
            {items.map((item, idx) => {
              const isCompleted = item.employeeId && item.date && item.timeSlot.start;
              const isCurrent = idx === currentStep;

              return (
                <div key={item.serviceId} className="flex flex-col items-center gap-1">
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                      isCurrent
                        ? "bg-[#7BAE6A] text-white ring-4 ring-[#7BAE6A]/20"
                        : isCompleted
                          ? "bg-[#7BAE6A] text-white"
                          : "bg-gray-200 text-gray-500",
                    ].join(" ")}
                  >
                    {isCompleted && !isCurrent ? "✓" : idx + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center max-w-[100px] break-words">                    {serviceNameById.get(item.serviceId) || t("bookingMulti.serviceLabel", { number: idx + 1 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <MultiServiceStepCard
          key={currentItem.serviceId}
          serviceName={serviceNameById.get(currentItem.serviceId)}
          providerId={providerId}
          serviceId={currentItem.serviceId}
          year={year}
          month={month}
          days={days}
          selectedEmployeeId={currentItem.employeeId}
          selectedDate={currentItem.date}
          selectedTime={currentItem.timeSlot.start}
          disabledDateTimes={items
            .filter((_, idx) => idx !== currentStep)
            .filter((it) => it.date && it.timeSlot.start)
            .map((it) => ({ date: it.date, time: it.timeSlot.start }))}
          onMonthYearChange={handleMonthYearChange}
          onPickEmployee={(eid) => setEmployee(currentStep, eid)}
          onPickDay={(d) => setDate(currentStep, d)}
          onPickTime={(slot) => setTimeSlot(currentStep, slot)}
          onClear={() => clearItem(currentStep)}
        />

        <div className="flex gap-3">
          {canGoPrev && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 rounded-xl py-3 text-sm font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              {t("bookingMulti.previous")}
            </button>
          )}

          {canGoNext && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex-1 rounded-xl py-3 text-sm font-semibold bg-[#7BAE6A] text-white hover:bg-[#6a9d5a] transition"
            >
              {t("bookingMulti.next", { defaultValue: "Next" })}
            </button>
          )}

          {isLastStep && (
            <button
              disabled={!isAllComplete}
              onClick={handleGoToPayment}
              className={[
                "flex-1 rounded-xl py-3 text-sm font-semibold transition",
                isAllComplete
                  ? "bg-[#7BAE6A] text-white hover:bg-[#6a9d5a]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed",
              ].join(" ")}
            >
              {t("bookingMulti.proceedToPayment")}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
