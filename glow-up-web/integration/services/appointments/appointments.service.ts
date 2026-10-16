import { post, get, patch } from "../../http/http.client";

const ANY_EMPLOYEE_ID = "any";

import {
  mapAppointmentApiResponseToUi,
  type ApiPaymentMethod,
  type AppointmentApiResponse,
  type AppointmentByIdResponse,
  type AppointmentCreateDto,
  type AppointmentResponseDto,
} from "./appointments.type";

import { useBookingStore } from "@/store/bookingStore";
import { useServicesStore } from "@/store/serviceStore";
import { useMultiBookingStore } from "@/store/multiBookingStore";

const toDateOnly = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const missingKeys = (x: {
  providerId: string;
  date: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  servicesCount: number;
}) => {
  const miss: string[] = [];
  if (!x.providerId) miss.push("providerId");
  if (!x.date) miss.push("date");
  if (!x.timeSlotStart) miss.push("timeSlot.start");
  if (!x.timeSlotEnd) miss.push("timeSlot.end");
  if (x.servicesCount <= 0) miss.push("services");
  return miss;
};

export function toApiPaymentMethod(uiPayment: string | null): ApiPaymentMethod {
  if (uiPayment === "wallet") return "WALLET";
  if (uiPayment?.startsWith("card-")) return "VISA";

  // ✅ FIX: package support (correct if statement)
  if (uiPayment === "package") return "PACKAGE";
  if (uiPayment && uiPayment.toLowerCase().startsWith("package"))
    return "PACKAGE";

  return "CASH"; // center, coupon, or default
}

export const AppointmentsService = {
  async create(
    isMultiMode: boolean = false,
    paymentMethod: ApiPaymentMethod = "CASH",
    userPackageId?: string | null,
    couponCode?: string | null,
  ): Promise<AppointmentResponseDto | AppointmentResponseDto[]> {
    const bookingState = useBookingStore.getState();
    const servicesState = useServicesStore.getState();
    const multiBookingState = useMultiBookingStore.getState();

    if (isMultiMode && multiBookingState.items.length > 0) {
      const services: AppointmentCreateDto["services"] =
        multiBookingState.items.map((item) => {
          const serviceItem: AppointmentCreateDto["services"][0] = {
            serviceItemId: item.serviceId,
            date: toDateOnly(item.date),
            employeeId:
              item.employeeId && item.employeeId !== ANY_EMPLOYEE_ID
                ? item.employeeId
                : undefined,
            anyEmployee:
              !item.employeeId || item.employeeId === ANY_EMPLOYEE_ID,
            numberOfCustomers: (item as any).numberOfCustomers ?? 1,
            timeSlot: item.timeSlot,
          };
          if (paymentMethod === "PACKAGE" && userPackageId) {
            serviceItem.userPackageId = userPackageId;
          }
          return serviceItem;
        });

      const body: AppointmentCreateDto = {
        providerId: multiBookingState.providerId,
        bookingType: "SELF",
        paymentMethod,
        services,
      };
      if (couponCode) body.couponCode = couponCode;
      if (bookingState.notes) body.customerNote = bookingState.notes;

      const res = await post<AppointmentResponseDto>(`/appointments`, body);

      useMultiBookingStore.getState().reset();
      useServicesStore.setState({ servicesIDS: [], notes: "" });
      useBookingStore.setState({ bookingFor: "complete" });

      return res.data;
    }

    // =============================
    // Single booking
    // =============================
    const providerId =
      bookingState.selectedProviderID ||
      servicesState.providerID ||
      multiBookingState.providerId;

    const rawDate = bookingState.selectedDate;
    const date = toDateOnly(rawDate);
    const timeSlot = bookingState.selectedTimeSlot;

    const arrayServiceIds = Array.isArray(servicesState.servicesIDS)
      ? servicesState.servicesIDS
      : [];

    const fallbackSingleServiceId =
      bookingState.selectedServiceID || servicesState.selectedServiceID;

    const finalServiceIds =
      arrayServiceIds.length > 0
        ? arrayServiceIds
        : fallbackSingleServiceId
          ? [fallbackSingleServiceId]
          : [];

    const employeeId =
      bookingState.selectedEmployeeID || servicesState.selectedEmployeeID || "";

    const miss = missingKeys({
      providerId: providerId ?? "",
      date,
      timeSlotStart: timeSlot?.start ?? "",
      timeSlotEnd: timeSlot?.end ?? "",
      servicesCount: finalServiceIds.length,
    });

    if (miss.length > 0) {
      throw new Error(`Missing booking data: ${miss.join(", ")}`);
    }

    const body: AppointmentCreateDto = {
      providerId: providerId!,
      bookingType: "SELF",
      paymentMethod,
      services: finalServiceIds.map((serviceItemId) => {
        const serviceItem: AppointmentCreateDto["services"][0] = {
          serviceItemId,
          date,
          employeeId:
            employeeId && employeeId !== ANY_EMPLOYEE_ID
              ? employeeId
              : undefined,
          anyEmployee: !employeeId || employeeId === ANY_EMPLOYEE_ID,
          numberOfCustomers: 1,
          timeSlot,
        };
        if (paymentMethod === "PACKAGE" && userPackageId) {
          serviceItem.userPackageId = userPackageId;
        }
        return serviceItem;
      }),
    };
    if (couponCode) body.couponCode = couponCode;
    if (bookingState.notes) body.customerNote = bookingState.notes;

    const res = await post<AppointmentResponseDto>(`/appointments`, body);

    useBookingStore.setState({ bookingFor: "complete" });
    useServicesStore.setState({ servicesIDS: [], notes: "" });

    return res.data;
  },

  async getAllAdminAppointments(
    page = 1,
    limit = 20,
    filters?: {
      status?: string;
      providerId?: string;
      customerId?: string;
      dateFrom?: string; // YYYY-MM-DD
      dateTo?: string; // YYYY-MM-DD
      customerName?: string;
      providerName?: string;
    },
  ): Promise<ReturnType<typeof mapAppointmentApiResponseToUi>> {
    const query = new URLSearchParams();
    query.append("page", String(page));
    query.append("limit", String(limit));

    if (filters?.status && filters.status !== "ALL")
      query.append("status", filters.status);
    if (filters?.providerId) query.append("providerId", filters.providerId);
    if (filters?.customerId) query.append("customerId", filters.customerId);
    if (filters?.dateFrom) query.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo) query.append("dateTo", filters.dateTo);

    if (filters?.customerName?.trim())
      query.append("customerName", filters.customerName.trim());
    if (filters?.providerName?.trim())
      query.append("providerName", filters.providerName.trim());

    const res = await get<AppointmentApiResponse>(
      `/appointments/admin/all?${query.toString()}`,
    );

    return mapAppointmentApiResponseToUi(res.data);
  },

  async cancelAppointment(
    appointmentId: string,
    reason?: string,
  ): Promise<void> {
    await patch(`/appointments/${appointmentId}/cancel?reason=${reason}`, {});
  },

  async changeTimeSlot(
    appointmentId: string,
    services: {
      serviceItemId: string;
      date: string;
      employeeId?: string;
      timeSlot: { start: string; end: string };
    }[],
    language: "ar" | "en" = "ar",
  ): Promise<void> {
    await patch(
      `/appointments/${appointmentId}`,
      { services },
      {
        headers: {
          "Accept-Language": language,
        },
      },
    );
  },
  async updateAppointmentStatus(
    appointmentId: string,
    status: "COMPLETED" | "CANCELLED" | "CONFIRMED",
    language: "ar" | "en" = "ar",
  ): Promise<void> {
    await patch(
      `/appointments/${appointmentId}/status?status=${status}`,
      {},
      {
        headers: {
          "Accept-Language": language,
        },
      },
    );
  },

  async getById(appointmentId: string): Promise<AppointmentByIdResponse | null> {
    try {
      const res = await get<AppointmentByIdResponse>(
        `/appointments/${appointmentId}`,
      );
      return res.data;
    } catch {
      return null;
    }
  },
};
