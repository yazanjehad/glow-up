import { get } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | string;

export interface ProviderAppointmentDto {
  appointmentId: string;
  customerName: string;
  date?: string;
  timeSlot?: { start: string; end: string };
  totalDurationMinutes: number;
  services: {
    serviceItemId: string;
    name: string;
    price: number;
    durationMinutes: number;

    date?: string;

    timeSlot?: { start: string; end: string };

    employeeId?: { _id: string; name: string };
    numberOfCustomers?: number;
    anyEmployee?: boolean;
    usedUserPackageId?: string | null;
    packageDiscountApplied?: number;
  }[];

  price: { servicesTotal: number; discount: number; finalTotal: number };
  status: AppointmentStatus;
  source?: string;
  customerNote?: string;
}

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const ProviderAppointmentsService = {
  async getMyAppointments(): Promise<ProviderAppointmentDto[]> {
    const res = await get<
      | ProviderAppointmentDto[]
      | { data?: ProviderAppointmentDto[]; appointments?: ProviderAppointmentDto[] }
    >("/appointments/provider", {
      headers: authHeader(),
    });

    const body = res.data;
    if (Array.isArray(body)) return body;
    if (body && typeof body === "object") {
      const wrapped = body as {
        data?: ProviderAppointmentDto[];
        appointments?: ProviderAppointmentDto[];
      };
      if (Array.isArray(wrapped.data)) return wrapped.data;
      if (Array.isArray(wrapped.appointments)) return wrapped.appointments;
    }
    return [];
  },

  async getEmployeeAppointments(): Promise<ProviderAppointmentDto[]> {
    const res = await get<
      | ProviderAppointmentDto[]
      | { data?: ProviderAppointmentDto[]; appointments?: ProviderAppointmentDto[] }
    >("/appointments/employee", {
      headers: authHeader(),
    });

    const body = res.data;
    if (Array.isArray(body)) return body;
    if (body && typeof body === "object") {
      const wrapped = body as {
        data?: ProviderAppointmentDto[];
        appointments?: ProviderAppointmentDto[];
      };
      if (Array.isArray(wrapped.data)) return wrapped.data;
      if (Array.isArray(wrapped.appointments)) return wrapped.appointments;
    }
    return [];
  },
};
