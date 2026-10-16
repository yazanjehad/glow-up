"use client";

import type {
  Booking,
  BookingFilterStatus,
} from "@/app/models/my-booking-types";
import BookingCard from "@/components/my-booking/BookingCard";
import EmptyState from "@/components/my-booking/EmptyState";
import { useTranslation } from "react-i18next";

function GroupBlock({ title, items }: { title: string; items: Booking[] }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className="space-y-4">
      <div
        className={[
          isRTL ? "text-right" : "text-left",
          "text-[16px] font-bold text-black/50",
        ].join(" ")}
      >
        {title}
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

const GROUP_LABEL_KEYS: Record<string, string> = {
  today: "bookings.today",
  tomorrow: "bookings.tomorrow",
  week_ahead: "bookings.week_ahead",
  later: "bookings.later",
  yesterday: "bookings.yesterday",
  week_ago: "bookings.week_ago",
  older: "bookings.older",
  canceled_week: "bookings.this_week",
};

export type BookingGroupKey = keyof typeof GROUP_LABEL_KEYS;

const ALL_GROUPS_ORDER: BookingGroupKey[] = [
  "today",
  "tomorrow",
  "week_ahead",
  "later",
  "yesterday",
  "week_ago",
  "older",
  "canceled_week",
];

const TAB_GROUPS: Record<BookingFilterStatus, BookingGroupKey[]> = {
  current: ["today", "tomorrow", "week_ahead", "later"],
  previous: ["yesterday", "week_ago", "older"],
  canceled: ["canceled_week"],
  all: ALL_GROUPS_ORDER,
};

type Props = {
  status: BookingFilterStatus;
  today: Booking[];
  tomorrow: Booking[];
  week_ahead: Booking[];
  later: Booking[];
  yesterday: Booking[];
  week_ago: Booking[];
  older: Booking[];
  canceled_week: Booking[];
  counts: Record<BookingFilterStatus, number>;
  isEmpty: boolean;
};

export default function MyBookingClient({
  status,
  today,
  tomorrow,
  week_ahead,
  later,
  yesterday,
  week_ago,
  older,
  canceled_week,
  isEmpty,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const titleKey: Record<BookingFilterStatus, string> = {
    all: "bookings.all",
    current: "bookings.current",
    previous: "bookings.previous",
    canceled: "bookings.canceled",
  };

  const groupsMap: Record<BookingGroupKey, Booking[]> = {
    today,
    tomorrow,
    week_ahead,
    later,
    yesterday,
    week_ago,
    older,
    canceled_week,
  };

  const visibleOrder = TAB_GROUPS[status];
  const hasAnyVisible = visibleOrder.some((key) => groupsMap[key].length > 0);
  const showEmpty = isEmpty || !hasAnyVisible;

  return (
    <div className="w-full flex-1 rounded-[22px] bg-white p-5 md:p-8 shadow-[0px_8px_32px_0px_#00000014]">
      <h2
        className={[
          "mb-6 text-[20px] font-bold text-[#111827]",
          isRTL ? "text-right" : "text-left",
        ].join(" ")}
      >
        {t(titleKey[status])}
      </h2>

      {showEmpty ? (
        <EmptyState
          title={t("bookings.empty")}
          imageSrc="/empty-bookings.png"
        />
      ) : (
        <div className="mt-4 space-y-8">
          {visibleOrder.map((key: BookingGroupKey) => {
            const items = groupsMap[key];

            if (items.length === 0) {
              return null;
            }

            return (
              <GroupBlock
                key={key}
                title={t(GROUP_LABEL_KEYS[key])}
                items={items}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
