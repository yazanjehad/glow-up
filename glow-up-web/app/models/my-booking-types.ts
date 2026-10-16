export type BookingStatus = "current" | "previous" | "canceled";
export type BookingGroup =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "week_ago"
  | "week_ahead"
  | "later"
  | "older"
  | "canceled_week";

export type Booking = {
  id: string;
  title: string;
  status: BookingStatus;
  group: BookingGroup;
  timeISO?: string;
  imageUrl?: string;
  employeeId?: string;
  employeeName?: string;
  providerId?: string;
  canRate?: boolean;
  // Details for popup
  date?: string;
  providerName?: string;
  timeSlot?: { start: string; end: string };
  totalDurationMinutes?: number;
  services?: Array<{
    name: string;
    durationMinutes?: number;
    price?: number;
  }>;
};

export type BookingFilterStatus = "all" | BookingStatus;

export const BOOKING_FILTER_STATUSES: BookingFilterStatus[] = [
  "all",
  "current",
  "previous",
  "canceled",
];

export function parseBookingFilterStatus(v: unknown): BookingFilterStatus {
  const x = typeof v === "string" ? v : "";
  return BOOKING_FILTER_STATUSES.includes(x as BookingFilterStatus)
    ? (x as BookingFilterStatus)
    : "all";
}

export type AppointmentApiStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export const ALLOWED_APPOINTMENT_STATUSES = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type AllowedAppointmentStatus =
  (typeof ALLOWED_APPOINTMENT_STATUSES)[number];

export function isAllowedStatus(
  s: AppointmentApiStatus,
): s is AllowedAppointmentStatus {
  return (ALLOWED_APPOINTMENT_STATUSES as readonly string[]).includes(s);
}

export interface AppointmentApiDto {
  id?: string;
  _id?: string;
  providerId?: string | { _id: string; name?: string };
  providerName?: string;
  customerName?: string;

  date: string;
  timeSlot?: {
    start: string;
    end: string;
  };
  totalDurationMinutes?: number;

  services?: Array<{
    serviceItemId: string;
    name: string;
    employeeId?: string | { _id: string; name: string };
    numberOfCustomers?: number;
    anyEmployee?: boolean;
    date?: string;
    timeSlot?: { start: string; end: string };
    price?: number;
    durationMinutes?: number;
  }>;

  status: AppointmentApiStatus;

  source?: string;
  customerNote?: string;

  cancellation?: {
    cancelledBy?: string;
    reason?: string;
    cancelledAt?: string;
  };
}

export type AppointmentsApiResponse = AppointmentApiDto[];

export function mapApiStatusToUi(
  status: AllowedAppointmentStatus,
): BookingStatus {
  if (status === "CONFIRMED") return "current";
  if (status === "COMPLETED") return "previous";
  return "canceled";
}


function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDaysFromToday(dateInput: string) {
  const bookingDate = new Date(dateInput);

  if (Number.isNaN(bookingDate.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const today = startOfLocalDay(new Date());
  const bookingDay = startOfLocalDay(bookingDate);

  const diffMs = today.getTime() - bookingDay.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function groupByDate(dateInput: string, status: BookingStatus): BookingGroup {
  const d = diffDaysFromToday(dateInput);

  if (status === "canceled") return "canceled_week";

  if (status === "previous") {
    if (d === 1) return "yesterday";
    if (d >= 2 && d <= 7 || d === 0) return "week_ago"; 
    return "older"; 
  }


  if (status === "current") {
    if (d === 0) return "today";
    if (d === -1) return "tomorrow";
    if (d <= -2 && d >= -7) return "week_ahead";
    if (d < -7) return "later";
    return "today"; 
  }

  return "older";
}

function buildTimeISO(dateYmd: string, start?: string) {
  if (!start) return undefined;

  const hhmm = start.length >= 5 ? start.slice(0, 5) : start;
  const d = new Date(`${dateYmd}T${hhmm}:00`);

  if (Number.isNaN(d.getTime())) return undefined;

  return d.toISOString();
}

function toDateOnly(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function mapAppointmentToBooking(
  dto: Omit<AppointmentApiDto, "status"> & { status: AllowedAppointmentStatus },
  idx: number,
): Booking {
  const title = dto.services?.length
    ? dto.services.map((s) => s.name).join(" + ")
    : (dto.providerName ?? "Booking");

  const firstService = dto.services?.[0];
  const rawEmployee = firstService?.employeeId;
  const employeeIdStr =
    typeof rawEmployee === "string" ? rawEmployee : rawEmployee?._id;
  const employeeNameStr =
    typeof rawEmployee === "object" && rawEmployee?.name
      ? rawEmployee.name
      : undefined;

  const dateFromDto = toDateOnly(dto.date) ?? (firstService?.date ? toDateOnly(firstService.date) : undefined);
  const dateStr = dateFromDto ?? dto.date;
  const timeSlot = dto.timeSlot ?? firstService?.timeSlot;
  const status = mapApiStatusToUi(dto.status);

  const providerId =
    typeof dto.providerId === "string"
      ? dto.providerId
      : dto.providerId?._id;

  const appointmentId = dto.id ?? dto._id ?? `${dateStr}-${idx}`;

  return {
    id: appointmentId,
    title,
    status,
    group: groupByDate(dateStr, status),
    timeISO: buildTimeISO(dateStr, timeSlot?.start),
    imageUrl: "/Bookings.jpg",

    employeeId: employeeIdStr,
    employeeName: employeeNameStr,
    providerId,
    canRate: dto.status === "COMPLETED",

    date: dateStr,
    providerName: dto.providerName,
    timeSlot,
    totalDurationMinutes: dto.totalDurationMinutes,
    services: dto.services?.map((s) => ({
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.price,
    })),
  };
}

export function mapAppointmentsToBookings(
  dtos: AppointmentApiDto[],
): Booking[] {
  const allowed = dtos.filter(
    (
      d,
    ): d is Omit<AppointmentApiDto, "status"> & {
      status: AllowedAppointmentStatus;
    } => isAllowedStatus(d.status),
  );

  return allowed.map((d, idx) => mapAppointmentToBooking(d, idx));
}
