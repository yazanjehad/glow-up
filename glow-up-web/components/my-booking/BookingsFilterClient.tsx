"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BookingFilterStatus } from "@/app/models/my-booking-types";
import {
  BOOKING_FILTER_STATUSES,
  parseBookingFilterStatus,
} from "@/app/models/my-booking-types";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  Clock,
  Archive,
  XCircle,
} from "lucide-react";

type Props = {
  counts: Record<BookingFilterStatus, number>;
};

const ICONS: Record<BookingFilterStatus, any> = {
  all: CalendarCheck,
  current: Clock,
  previous: Archive,
  canceled: XCircle,
};

export default function BookingsFilterClient({ counts }: Props) {
  const sp = useSearchParams();
  const status = parseBookingFilterStatus(sp?.get("status"));
  const { t } = useTranslation();

  const labelKey: Record<BookingFilterStatus, string> = {
    all: "bookings.all",
    current: "bookings.current",
    previous: "bookings.previous",
    canceled: "bookings.canceled",
  };

  return (
    <div className="rounded-2xl bg-white p-3 shadow ring-1 ring-black/5">
      <div className="space-y-1">
        {BOOKING_FILTER_STATUSES.map((v) => {
          const active = v === status;
          const Icon = ICONS[v];

          return (
            <Link
              key={v}
              href={v === "all" ? "/my-booking" : `/my-booking?status=${v}`}
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                active
                  ? "bg-[#EEF5EA] text-[#6FA35D]"
                  : "text-[#111827] hover:bg-black/5",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-5 w-5",
                  active ? "text-[#6FA35D]" : "text-[#111827]",
                ].join(" ")}
                strokeWidth={2}
              />

              <span className="flex-1 text-right text-[14px] font-semibold">
                {t(labelKey[v])}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
