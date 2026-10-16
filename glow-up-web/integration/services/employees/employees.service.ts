import { get, post, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";
import type { EmployeeDto, WorkFor } from "./employees.types";
import type { TeamMemberForm } from "@/app/models/provider-team-types";
import type { WorkingHoursSchedule, DayKey } from "@/store/providerStore";

type ApiWeekDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

type ApiWeeklyItem = {
  day: ApiWeekDay;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type ApiWorkingHours = {
  timezone: string;
  weekly: ApiWeeklyItem[];
  breaks?: {
    custom?: any[];
  };
};

const DAY_KEY_TO_API: Record<DayKey, ApiWeekDay> = {
  sunday: "SUNDAY",
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
};

const API_DAY_TO_KEY: Record<ApiWeekDay, DayKey> = {
  SUNDAY: "sunday",
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
};

const API_BASE_URL = "https://api-staging.theglowhub.com.sa";

function buildFileUrl(path?: string): string {
  const clean = (path || "").trim();
  if (!clean) return "";
  if (clean.startsWith("data:")) return clean;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  if (clean.startsWith("/files/public?path=")) return `${API_BASE_URL}${clean}`;
  if (clean.startsWith("files/public?path=")) return `${API_BASE_URL}/${clean}`;
  return `${API_BASE_URL}/files/public?path=${encodeURIComponent(clean)}`;
}

function convertToApiWorkingHours(
  schedule?: WorkingHoursSchedule,
): ApiWorkingHours | undefined {
  if (!schedule) return undefined;

  const weekly: ApiWeeklyItem[] = (Object.keys(schedule) as DayKey[]).map(
    (dayKey) => {
      const day = schedule[dayKey];
      return {
        day: DAY_KEY_TO_API[dayKey],
        isOpen: day.open,
        openTime: day.from,
        closeTime: day.to,
      };
    },
  );

  return {
    timezone: "Asia/Jerusalem",
    weekly,
    breaks: { custom: [] },
  };
}

function convertFromApiWorkingHours(
  apiHours?: ApiWorkingHours,
): WorkingHoursSchedule | undefined {
  if (!apiHours || !apiHours.weekly) return undefined;

  const schedule: Partial<WorkingHoursSchedule> = {};

  for (const item of apiHours.weekly) {
    const dayKey = API_DAY_TO_KEY[item.day];
    if (dayKey) {
      schedule[dayKey] = {
        open: item.isOpen,
        from: item.openTime || "10:00",
        to: item.closeTime || "18:00",
      };
    }
  }

  const allDays: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  for (const day of allDays) {
    if (!schedule[day]) {
      schedule[day] = { open: false, from: "10:00", to: "18:00" };
    }
  }

  return schedule as WorkingHoursSchedule;
}

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type PositionApi =
  | string
  | {
    _id?: string;
    code?: string;
    name?: { ar?: string; en?: string };
  };

type EmployeeApi = {
  _id?: string;
  id?: string;
  providerId?: string;
  name?: string;
  position?: PositionApi;
  workFor?: WorkFor;
  gender?: "MALE" | "FEMALE";
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean; 
  ratings?: {
    customerId?: { _id: string } | string;
    rating: number;
    comment?: string;
  }[];
  totalRatings?: number;
  averageRating?: number;
};

type EmployeeServiceRefApi =
  | string
  | { _id?: string }
  | { serviceItemId?: string };

type EmployeeFullInfoApi = EmployeeApi & {
  phone?: string;
  email?: string;
  gender?: "MALE" | "FEMALE";
  services?: EmployeeServiceRefApi[];
  schedule?: any;
  workingHours?: any;
  capabilities?: {
    canLogin?: boolean;
    canViewOwnBookings?: boolean;
    canViewStatistics?: boolean;
    canManageBreakTime?: boolean;
  };
   isActive?: boolean;
};

const pickPositionId = (p?: PositionApi) => {
  if (!p) return "";
  if (typeof p === "string") return p;
  return (p._id || "").toString();
};

const pickPositionLabel = (p?: PositionApi, lang?: string) => {
  if (!p) return "";
  if (typeof p === "string") return p;

  const currentLang = lang || "ar"; // Default to ar for mapping if not provided
  const isEn = currentLang.startsWith("en");

  if (isEn) {
    return (
      p?.name?.en?.toString().trim() ||
      p?.name?.ar?.toString().trim() ||
      p?.code?.toString().trim() ||
      ""
    );
  }

  return (
    p?.name?.ar?.toString().trim() ||
    p?.name?.en?.toString().trim() ||
    p?.code?.toString().trim() ||
    ""
  );
};

const mapEmployee = (e: EmployeeApi, lang?: string): EmployeeDto => {

  return {
    id: (e._id || e.id || "").toString(),
    providerId: (e.providerId || "").toString(),
    name: (e.name || "").toString(),

    positionId: pickPositionId(e.position) || undefined,
    positionLabel: pickPositionLabel(e.position, lang) || undefined,

    workFor: e.workFor,
    gender: e.gender,
    profileImage: e.profileImage,

    // avatarUrl: buildFileUrl(e.profileImage),

    phone: (e as any).phone,
    email: (e as any).email,

    workingHours: convertFromApiWorkingHours((e as any).schedule || (e as any).workingHours),

    createdAt: e.createdAt,
    updatedAt: e.updatedAt,

    ratings: e.ratings?.map(r => ({
      customerId:
        typeof r.customerId === "string"
          ? r.customerId
          : r.customerId?._id || "",
      customerName:
        typeof r.customerId === "string"
          ? undefined
          : (r.customerId as any)?.name || "",
      rating: r.rating,
      comment: r.comment,
    })),

    totalRatings: e.totalRatings,
    averageRating: e.averageRating,
  };
};
function unwrapData<T>(res: any): T {
  return (res?.data?.data ?? res?.data ?? res) as T;
}

function unwrapFullInfo(raw: any): EmployeeFullInfoApi {
  if (!raw) return {};
  if (raw?.employee) return raw.employee as EmployeeFullInfoApi;
  return raw as EmployeeFullInfoApi;
}

function extractServiceIds(services: any): string[] {
  if (!Array.isArray(services)) return [];
  return services
    .map((x) => {
      if (!x) return "";
      if (typeof x === "string") return x;
      if (typeof x === "object") return x.serviceItemId || x._id || "";
      return "";
    })
    .filter(Boolean)
    .map((x) => x.toString());
}

function extractServiceDetails(services: any): { id: string; name: string }[] {
  if (!Array.isArray(services)) return [];
  return services
    .map((x) => {
      if (!x) return null;
      if (typeof x === "string") return { id: x, name: "" };
      if (typeof x === "object") {
        const id = x.serviceItemId || x._id || "";
        const name = x.name || x.serviceName || "";
        return id ? { id: id.toString(), name } : null;
      }
      return null;
    })
    .filter(Boolean) as { id: string; name: string }[];
}

export interface EmployeeFullInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  role: string;
  avatarUrl?: string;
  position: any;
  services: {
    serviceItemId: string;
    isActive: boolean;
    addedAt: string;
    name: string;
    description: string;
  }[];
  ratings: {
    rating: number;
    comment: string;
    customerId: string;
    customerName?: string;
  }[];
  totalRatings: number;
  averageRating: number;
  page: number;
  limit: number;
}

function normalizeSaudiPhone(input?: string): string | undefined {
  const raw = (input || "").trim();
  if (!raw) return undefined;

  const digits = raw.replace(/\D/g, "");

  if (/^05\d{8}$/.test(digits)) return digits;
  if (/^5\d{8}$/.test(digits)) return "0" + digits;
  if (/^9665\d{8}$/.test(digits)) return "0" + digits.slice(3);
  if (/^96605\d{8}$/.test(digits)) return digits.slice(3);

  return undefined;
}

export const employeesServices = {
  create: async (
    providerId: string,
    member: TeamMemberForm,
    workFor: WorkFor,
  ): Promise<EmployeeDto> => {
    if (!providerId) throw new Error("providerId is required");

    const name = (member.name || "").trim();
    const position = (member.positionId || "").trim();

    if (!name) throw new Error("Employee name is required");
    if (!position) throw new Error("Employee position is required");

    const phone = normalizeSaudiPhone(member.phone);
    if (member.phone?.trim() && !phone) {
      throw new Error("INVALID_PHONE_FORMAT");
    }

    const workingHoursPayload =
      member.useCustomHours && member.workingHours
        ? convertToApiWorkingHours(member.workingHours)
        : undefined;

    const payload = {
      name,
      position,
      workFor,
      gender: member.gender,
      ...(phone ? { phone } : {}),
      ...(member.email?.trim() ? { email: member.email.trim() } : {}),
      ...(workingHoursPayload ? { workingHours: workingHoursPayload } : {}),
    };

    const res = await post<EmployeeApi>("/employees", payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    const rawCreated = unwrapData<any>(res); // {employee: {...}, user: {...}}

// استخرج الـ employee من response
const employeeObj = rawCreated.employee;
const created = mapEmployee(employeeObj);

return created; // الآن created.id سيكون موجود

 
    return mapEmployee(created);
  },

  listByProvider: async (
    providerId: string,
    lang?: string,
  ): Promise<EmployeeDto[]> => {
    if (!providerId) return [];

    const res = await get<EmployeeApi[] | { data: EmployeeApi[] }>(
      `/employees/provider/${providerId}`,
      { headers: authHeader() },
    );

    const raw = unwrapData<EmployeeApi[] | { data: EmployeeApi[] }>(res);

    const list = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);

    return (list || []).map((e: EmployeeApi) => mapEmployee(e, lang));
  },

  listByProviderByService: async (
    providerId: string,
    serviceId: string,
    lang?: string,
  ): Promise<EmployeeDto[]> => {
    if (!providerId || !serviceId) return [];

    const res = await get<EmployeeApi[] | { data: EmployeeApi[] }>(
      `/employees/provider/${providerId}/services/${serviceId}`,
      { headers: authHeader() },
    );

    const raw = unwrapData<EmployeeApi[] | { data: EmployeeApi[] }>(res);
    const list = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
    return (list || []).map((e: EmployeeApi) => mapEmployee(e, lang));
  },

  getById: async (employeeId: string, lang?: string): Promise<EmployeeDto> => {
    if (!employeeId) throw new Error("employeeId is required");

    const res = await get<EmployeeApi>(`/employees/${employeeId}`, {
      headers: authHeader(),
    });

    const raw = unwrapData<EmployeeApi>(res);
    return mapEmployee(raw, lang);
  },

  getFullInfo: async (
    employeeId: string,
    page = 1,
    limit = 200,
    lang?: string,
  ) => {
    if (!employeeId) throw new Error("employeeId is required");

    const url = `/employees/${employeeId}/full-info/provider?page=${page}&limit=${limit}`;
    const res = await get<EmployeeFullInfoApi | { data: any }>(url, {
      headers: authHeader(),
    });

    const raw0 = unwrapData<any>(res);
    const employeeObj = unwrapFullInfo(raw0);

    const phone = (raw0?.phone ?? employeeObj?.phone ?? "").toString();
    const email = (raw0?.email ?? employeeObj?.email ?? "").toString();

    const servicesRaw = raw0?.services ?? employeeObj?.services ?? [];
    const serviceIds = extractServiceIds(servicesRaw);
    const serviceDetails = extractServiceDetails(servicesRaw);

    const rawWorkingHours =
      raw0?.schedule ?? employeeObj?.schedule ?? (raw0 as any)?.workingHours ?? (employeeObj as any)?.workingHours ?? undefined;
    const workingHours = convertFromApiWorkingHours(rawWorkingHours);

    const capabilities = raw0?.capabilities ?? employeeObj?.capabilities ?? undefined;
    
const isActive =
  raw0?.isActive ??
  employeeObj?.isActive ??
  false;
    return {
      employee: mapEmployee(employeeObj, lang),
      phone,
      email,
      services: serviceIds,
      serviceDetails,
      workingHours,
      rawWorkingHours,
      capabilities,
       isActive,
      raw: raw0,
    };
  },

  update: async (
    employeeId: string,
    payload: Partial<{
      phone: string;
      email: string;
      services: string[];
      name: string;
      position: string;
      password: string;
      workFor: WorkFor;
      gender: "MALE" | "FEMALE";
      workingHours: any;
      isActive: boolean;
    }>,
  ) => {
    if (!employeeId) throw new Error("employeeId is required");

    const nextPayload: any = { ...payload };

    if ("phone" in nextPayload) {
      const phone = normalizeSaudiPhone(nextPayload.phone);
      if (nextPayload.phone?.trim() && !phone) {
        throw new Error("INVALID_PHONE_FORMAT");
      }
      if (phone) nextPayload.phone = phone;
      else delete nextPayload.phone;
    }

    if ("email" in nextPayload) {
      const email = (nextPayload.email || "").trim();
      if (email) nextPayload.email = email;
      else delete nextPayload.email;
    }

    if ("workingHours" in nextPayload && nextPayload.workingHours) {
      nextPayload.workingHours = convertToApiWorkingHours(
        nextPayload.workingHours,
      );
    }

    const res = await patch(`/employees/${employeeId}`, nextPayload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    return unwrapData<any>(res);
  },

  updateCapabilities: async (
    employeeId: string,
    capabilities: {
      canLogin?: boolean;
      canViewOwnBookings?: boolean;
      canViewStatistics?: boolean;
      canManageBreakTime?: boolean;
    },
  ) => {
    if (!employeeId) throw new Error("employeeId is required");

    const res = await patch(`/employees/${employeeId}/capabilities`, capabilities, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });

    return unwrapData<any>(res);
  },

  getPublicFullInfo: async (
    employeeId: string,
    page = 1,
    limit = 20,
  ): Promise<any> => {
    if (!employeeId) throw new Error("employeeId is required");

    const url = `/employees/${employeeId}/full-info?page=${page}&limit=${limit}`;
    const res = await get<any>(url);
    const data = unwrapData<any>(res);

    const formattedRatings = data.ratings?.map((r: any) => ({
      ...r,
      customerName: r.customerId?.name || "عميل"
    }));

    return {
      ...data,
      ratings: formattedRatings,
      avatarUrl: buildFileUrl(data.profileImage),
    };
  },
};
