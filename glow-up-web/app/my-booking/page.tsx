"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

import type {
  Booking,
  BookingFilterStatus,
} from "@/app/models/my-booking-types";
import { parseBookingFilterStatus } from "@/app/models/my-booking-types";

import MyBookingClient from "@/components/my-booking/MyBookingClient";
import { getMyBookings } from "@/integration/services/appointments-my-booking/appointments.service";
import { useMyBookingsStore } from "@/store/bookingStore";
const EMPTY: Booking[] = [];

export default function MyBookingPage() {
  const sp = useSearchParams();
  const status: BookingFilterStatus = parseBookingFilterStatus(
    sp?.get("status"),
  );

  const all = useMyBookingsStore((s) => s.all);
  const current = useMyBookingsStore((s) => s.byStatus.current ?? EMPTY);
  const previous = useMyBookingsStore((s) => s.byStatus.previous ?? EMPTY);
  const canceled = useMyBookingsStore((s) => s.byStatus.canceled ?? EMPTY);

  const error = useMyBookingsStore((s) => s.error);

  const actionsRef = useRef(useMyBookingsStore.getState());
  actionsRef.current = useMyBookingsStore.getState();

  const cached =
    status === "all"
      ? all.length > 0
      : status === "current"
        ? current.length > 0
        : status === "previous"
          ? previous.length > 0
          : canceled.length > 0;

  useEffect(() => {
    let cancelledReq = false;

    async function load() {
      if (cached) return;

      const { setLoading, setError, setAll, setStatusItems } =
        actionsRef.current;

      try {
        setError(null);
        setLoading(true);

        const data = await getMyBookings(status);
        if (cancelledReq) return;

        if (status === "all") setAll(data);
        else setStatusItems(status, data);
      } catch (e: any) {
        if (cancelledReq) return;
        setError(e?.response?.data?.message ?? "Failed to load bookings");
      } finally {
        if (!cancelledReq) actionsRef.current.setLoading(false);
      }
    }

    load();
    return () => {
      cancelledReq = true;
    };
  }, [status, cached]);

  const source: Booking[] =
    status === "all"
      ? all
      : status === "current"
        ? current
        : status === "previous"
          ? previous
          : canceled;

  const groupsAndCounts = useMemo(() => {
    const today = source.filter((b) => b.group === "today");
    const tomorrow = source.filter((b) => b.group === "tomorrow");
    const week_ahead = source.filter((b) => b.group === "week_ahead");
    const later = source.filter((b) => b.group === "later");
    const sortCompletedFirst = (a: Booking, b: Booking) =>
      (b.canRate ? 1 : 0) - (a.canRate ? 1 : 0);
    const yesterday = source
      .filter((b) => b.group === "yesterday")
      .sort(sortCompletedFirst);
    const week_ago = source
      .filter((b) => b.group === "week_ago")
      .sort(sortCompletedFirst);
    const older = source
      .filter((b) => b.group === "older")
      .sort(sortCompletedFirst);
    const canceled_week = source.filter((b) => b.group === "canceled_week");

    const counts: Record<BookingFilterStatus, number> = {
      all:
        all.length > 0
          ? all.length
          : current.length + previous.length + canceled.length,
      current: current.length,
      previous: previous.length,
      canceled: canceled.length,
    };

    return {
      today,
      tomorrow,
      week_ahead,
      later,
      yesterday,
      week_ago,
      older,
      canceled_week,
      counts,
      isEmpty: source.length === 0,
    };
  }, [source, all.length, current.length, previous.length, canceled.length]);

  return (
    <MyBookingClient
      status={status}
      {...groupsAndCounts}
      isEmpty={groupsAndCounts.isEmpty || !!error}
    />
  );
}
