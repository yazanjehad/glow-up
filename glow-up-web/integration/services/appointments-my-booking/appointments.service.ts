import { get } from "@/integration/http/http.client";
import type { BookingFilterStatus, Booking } from "@/app/models/my-booking-types";

import type {
  AppointmentApiDto,
  AppointmentApiStatus,
} from "@/app/models/my-booking-types";
import { mapAppointmentsToBookings } from "@/app/models/my-booking-types";

const STATUS_MAP: Record<
  Exclude<BookingFilterStatus, "all">,
  AppointmentApiStatus
> = {
  current: "CONFIRMED",
  previous: "COMPLETED",
  canceled: "CANCELLED",
};

const ALL_STATUSES: AppointmentApiStatus[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

export async function getMyBookings(
  status: BookingFilterStatus
): Promise<Booking[]> {
  // all statuses
  if (status === "all") {
    const results = await Promise.all(
      ALL_STATUSES.map(async (s) => {
        const res = await get<AppointmentApiDto[]>("/appointments/me", {
          params: { status: s },
        });
        return res.data;
      })
    );

    const mergedDtos = results.flat();
    return mapAppointmentsToBookings(mergedDtos);
  }

  if (status === "previous") {
    const res = await get<AppointmentApiDto[]>("/appointments/me", {
      params: { status: "COMPLETED" },
    });
    return mapAppointmentsToBookings(res.data);
  }

  const apiStatus = STATUS_MAP[status];
  const res = await get<AppointmentApiDto[]>("/appointments/me", {
    params: { status: apiStatus },
  });

  return mapAppointmentsToBookings(res.data);
}
