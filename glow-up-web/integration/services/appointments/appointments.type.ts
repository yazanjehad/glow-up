export type AppointmentServiceItemDto = {
  serviceItemId: string;
  date: string;
  employeeId?: string;
  anyEmployee: boolean;
  numberOfCustomers: number;
  timeSlot: { start: string; end: string };
  /** مطلوب عند الدفع بالباقة (paymentMethod: PACKAGE) */
  userPackageId?: string;
};

export type ApiPaymentMethod = "CASH" | "VISA" | "WALLET" | "PACKAGE";
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type UpdatableAppointmentStatus = "COMPLETED" | "CANCELLED";

export interface AppointmentCreateDto {
  providerId: string;
  services: AppointmentServiceItemDto[];
  bookingType: "SELF" | "OTHER";
  paymentMethod: ApiPaymentMethod;
  /** مطلوب عند الدفع بالكوبون - الـ API يقبل CASH/VISA/WALLET/PACKAGE فقط، نمرّر CASH مع couponCode */
  couponCode?: string;
  customerNote?: string;
}

export interface AppointmentResponseDto {
  id: string;
  providerId: string;
  status: string;
  bookingType: string;
  createdAt: string;
  updatedAt: string;
}

// appointment.types.ts

export interface AppointmentServiceDto {
  serviceItemId: string;
  name: string;
  price: number;
  durationMinutes: number;
  employeeName?: string;
  employeeId?: string | { _id: string; name: string };
  numberOfCustomers?: number;
  date?: string;
  timeSlot?: { start: string; end: string };
  anyEmployee?: boolean;
}
export interface AppointmentApiDto {
  _id: string;
  providerId: { _id: string; name: string };
  customerId: { _id: string; name: string };

  employeeId?: string;
  date: string;
  timeSlot: { start: string; end: string };
  totalDurationMinutes: number;
  services: AppointmentServiceDto[];
  price: {
    servicesTotal: number;
    discount: number;
    finalTotal: number;
  };
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  source: string;
  bookingType: "SELF" | "OTHER";
  customerNote?: string;
  completedBy?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface AppointmentApiResponse {
  totalPages: number;
  data: AppointmentApiDto[];
  stats: {
    approved: number;
    completed: number;
    cancelled: number;
  };
  total: number;
  page: number;
  limit: number;
}

// Single appointment response (getById endpoint)
export interface AppointmentByIdResponse {
  provider: {
    _id: string;
    name: string;
    coverImage?: string;
    address?: string;
    rating?: { average: number; count: number };
    services: {
      category: string;
      items: {
        _id: string;
        name: string;
        price: number;
        durationMinutes: number;
        isActive: boolean;
      }[];
    }[];
  };
  customerName: string;
  totalDurationMinutes: number;
  services: {
    serviceItemId: string;
    name: string;
    price: number;
    durationMinutes: number;
    employeeId?: { _id: string; name: string };
    numberOfCustomers?: number;
    anyEmployee?: boolean;
    date?: string;
    timeSlot?: { start: string; end: string };
  }[];
  price: {
    servicesTotal: number;
    discount: number;
    finalTotal: number;
  };
  status: string;
  source?: string;
  customerNote?: string;
}

// UI TYPES

export interface AppointmentUi {
  id: string;
  providerName: string;
  customerName: string;
  employeeName: string;
  employeeId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  totalDurationMinutes: number;
  services: {
    name: string;
    price: number;
    durationMinutes: number;
    employee?: string;
  }[];
  totalPrice: number;
  status: string;
  bookingType: string;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

// MAPPER
export const mapAppointmentApiToUi = (
  api: AppointmentApiDto,
): AppointmentUi => {
  const firstService = api.services?.[0];
  const resolveName = (data: any): string => {
    if (!data) return "N/A";
    if (typeof data === "string") {
      // إذا كان النص يبدو كـ ID (طويل ولا يحتوي مسافات) نرجع N/A
      return data.length > 20 && !data.includes(" ") ? "N/A" : data;
    }
    if (typeof data === "object") return data.name || "N/A";
    return "N/A";
  };

  return {
    id: api._id,
    providerName: resolveName(api.providerId),
    customerName: resolveName(api.customerId),

    employeeName: resolveName(firstService?.employeeId || api.employeeId),
    employeeId:
      typeof api.employeeId === "string"
        ? api.employeeId
        : (api.employeeId as any)?._id || "",

    date: firstService?.date || api.date || "",
    timeStart: firstService?.timeSlot?.start || api.timeSlot?.start || "--:--",
    timeEnd: firstService?.timeSlot?.end || api.timeSlot?.end || "--:--",

    totalDurationMinutes: api.totalDurationMinutes || 0,

    services: (api.services || []).map((s) => ({
      name: s.name || (s as any).serviceItemId?.name || "Service",
      price: s.price,
      durationMinutes: s.durationMinutes,
      employee: resolveName(s.employeeId || (s as any).employeeName),
    })),

    totalPrice: api.price?.finalTotal || 0,
    status: api.status,
    bookingType: api.bookingType,
    customerNote: api.customerNote || "",
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
};
// Mapper  Response
export const mapAppointmentApiResponseToUi = (
  response: AppointmentApiResponse,
): {
  data: AppointmentUi[];
  totalPages: number;
  total: number;
  page: number;
  limit: number;
  stats: AppointmentApiResponse["stats"];
} => {
  return {
    data: response.data.map(mapAppointmentApiToUi),
    totalPages: response.totalPages,
    total: response.total,
    page: response.page,
    limit: response.limit,
    stats: response.stats,
  };
};
