import { get, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

import {
  mapApiToSalon,
  mapProviderServicesToUiItems,
  type ProviderServiceCategoryApiDto,
  type ProviderServiceUiItem,
  type SalonApiDto,
  type SalonApiResponse,
  type SalonUi,
  type UpdateProviderStatusDto,
  type PaginatedSalonResponse,
  type HomeProvidersApiResponse,
  type ProviderPackageApiDto,
} from "./provider.types";

import type { ProviderSlotsDayDto } from "@/app/models/provider-slots";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getStoredProviderId(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("providerId") || "").trim();
}

function resolveId(id?: string): string {
  const v = (id || "").trim();
  return v || getStoredProviderId();
}

export function buildServiceOptionsFromApi(
  categories: ProviderServiceCategoryApiDto[] = [],
): { _id: string; label: string }[] {
  const flat = mapProviderServicesToUiItems(categories);

  return (flat ?? [])
    .filter((it) => Boolean(it?.id))
    .map((it) => {
      const right: string[] = [];

      if (typeof it.price === "number") {
        right.push(`${it.price}`);
      }

      if (typeof it.durationMinutes === "number") {
        right.push(`${it.durationMinutes}m`);
      }

      const label = `${it.name}${right.length ? ` — ${right.join(" / ")}` : ""}`;

      return {
        _id: it.id,
        label,
      };
    });
}

export type PatchProviderPayload = Partial<{
  name: string;
  // city: string;
  type: string;
  // street: string;
  description: string;
  phones: string[];
  email: string;
  serviceLocation: "home" | "salon" | "both";
  workingHours: {
    timezone: string;
    weekly: {
      day:
      | "SUNDAY"
      | "MONDAY"
      | "TUESDAY"
      | "WEDNESDAY"
      | "THURSDAY"
      | "FRIDAY"
      | "SATURDAY";
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    }[];
  };
}>;

export const ServiceProvider = {

  async getToFilter(params?: {
    name?: string;
    type?: string;
    serviceCategory?: string;
    location?: string;
    rating?: number;
    serviceLocation?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SalonApiDto[]; meta: any }> {
    const query = new URLSearchParams();

    if (params?.name?.trim()) query.append("name", params.name);
    if (params?.type?.trim()) query.append("type", params.type);

    if (params?.location?.trim()) query.append("location", params.location);

    if (params?.rating) query.append("rating", params.rating.toString());
    if (params?.status) query.append("status", params.status);
    if (params?.serviceLocation) query.append("serviceLocation", params.serviceLocation);
    if (params?.serviceCategory?.trim()) {
      query.append("serviceCategory", params.serviceCategory);
    }
    if (params?.latitude) query.append("latitude", params.latitude.toString());
    if (params?.longitude) query.append("longitude", params.longitude.toString());
    query.append("page", (params?.page ?? 1).toString());
    query.append("limit", (params?.limit ?? 100).toString());

    const url = `/providers?${query.toString()}`;

    const apiResponse = await get<SalonApiResponse>(url, {
      headers: authHeader(),
    });

    return {
      data: apiResponse.data?.data ?? [],
      meta: apiResponse.data?.meta ?? { total: 0, page: 1, limit: 10, lastPage: 1 },
    };
  },
  async getAll(): Promise<SalonUi[]> {
    const apiResponse = await get<SalonApiResponse>(`/providers`, {
      headers: authHeader(),
    });
    const responseData: SalonApiDto[] = apiResponse.data?.data ?? [];
    return responseData.map((salon) => mapApiToSalon(salon));
  },

  /**
   * GET BY ID - supports both direct id and localStorage.
   * Handles API response as either direct provider or wrapped in { data: provider } so packages are always available.
   */
  async getById(id?: string, lang?: "ar" | "en"): Promise<SalonUi> {
    const providerId = resolveId(id);
    if (!providerId) throw new Error("Missing providerId");

    const apiResponse = await get<SalonApiDto>(`/providers/${providerId}`, {
      headers: authHeader(),
    });

    const body = apiResponse.data as SalonApiDto & { data?: SalonApiDto };
    const dto = body?.data ?? body;
    return mapApiToSalon(dto, lang);
  },

  /**
 * GET BY ID - supports both direct id and localStorage.
 * Handles API response as either direct provider or wrapped in { data: provider } so packages are always available.
 */
  async getMe(lang?: "ar" | "en"): Promise<SalonUi> {
    const apiResponse = await get<SalonApiDto>(`/providers/me`, {
      headers: authHeader(),
    });

    const body = apiResponse.data as SalonApiDto & { data?: SalonApiDto };
    const dto = body?.data ?? body;
    return mapApiToSalon(dto, lang);
  },

  async getMeRaw(): Promise<SalonApiDto> {
    const apiResponse = await get<SalonApiDto>(`/providers/me`, {
      headers: authHeader(),
    });

    const body = apiResponse.data as SalonApiDto & { data?: SalonApiDto };
    return body?.data ?? body;
  },

  /**
   * GET home page providers (newest, topRated, nearest, anonymousList).
   * Pass latitude & longitude to fill "nearest" (user must allow location).
   */
  async getHome(latitude?: number, longitude?: number): Promise<HomeProvidersApiResponse> {
    const params = new URLSearchParams();
    if (latitude != null && !Number.isNaN(latitude)) params.set("latitude", String(latitude));
    if (longitude != null && !Number.isNaN(longitude)) params.set("longitude", String(longitude));
    const query = params.toString();
    const res = await get<HomeProvidersApiResponse>(
      `/providers/home${query ? `?${query}` : ""}`
    );
    return res.data;
  },

  async getByIdRaw(id?: string): Promise<SalonApiDto> {
    const providerId = resolveId(id);
    if (!providerId) throw new Error("Missing providerId");

    const apiResponse = await get<SalonApiDto>(`/providers/${providerId}`, {
      headers: authHeader(),
    });

    const body = apiResponse.data as SalonApiDto & { data?: SalonApiDto };
    return body?.data ?? body;
  },

  async getAllWithStatus(params?: {
    name?: string;
    type?: string;
    location?: string;
    rating?: number;
    serviceLocation?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedSalonResponse> {
    const query = new URLSearchParams();

    if (params?.name) query.append("name", params.name);
    if (params?.type) query.append("type", params.type);
    if (params?.location) query.append("location", params.location);
    if (params?.rating) query.append("rating", params.rating.toString());
    if (params?.serviceLocation)
      query.append("serviceLocation", params.serviceLocation);
    if (params?.latitude) query.append("latitude", params.latitude.toString());
    if (params?.longitude)
      query.append("longitude", params.longitude.toString());
    if (params?.status && params.status !== "ALL")
      query.append("status", params.status);

    query.append("page", (params?.page ?? 1).toString());
    query.append("limit", (params?.limit ?? 10).toString());

    let url = `/providers/status?${query.toString()}`;
    let apiResponse;

    try {
      apiResponse = await get<SalonApiResponse>(url, {
        headers: authHeader(),
      });
    } catch (error: any) {
      // Fallback for non-super-admin users who have permissions but are forbidden from /providers/status
      if (error?.response?.status === 403) {
        url = `/providers?${query.toString()}`;
        apiResponse = await get<SalonApiResponse>(url, {
          headers: authHeader(),
        });
      } else {
        throw error;
      }
    }

    const responseData: SalonApiDto[] = apiResponse.data?.data ?? [];
    const salons = responseData.map((salon) => mapApiToSalon(salon));

    const meta = apiResponse.data?.meta ?? {
      total: 0,
      page: 1,
      limit: 10,
      lastPage: 1,
    };

    return { data: salons, meta };
  },

  async updateStatus(data: UpdateProviderStatusDto) {
    const { id, status, reason } = data;

    const query = new URLSearchParams({ status });
    if (reason) query.append("reason", reason);

    const url = `/admin/providers/${id}/status?${query.toString()}`;

    const response = await patch(url, {}, { headers: authHeader() });
    return response.data;
  },

  async updateProfile(
    payload: PatchProviderPayload,
    id?: string,
  ): Promise<SalonUi> {
    const providerId = resolveId(id);
    if (!providerId) throw new Error("Missing providerId");

    const res = await patch<SalonApiDto>(`/providers/${providerId}`, payload, {
      headers: authHeader(),
    });
    return mapApiToSalon(res.data);
  },

  async getRelated(
    id?: string,
    page: number = 1,
    limit: number = 5,
    lang?: "ar" | "en",
  ): Promise<SalonUi[]> {
    const providerId = resolveId(id);
    if (!providerId) throw new Error("Missing providerId");

    const apiResponse = await get<SalonApiResponse>(
      `/providers/${providerId}/related?page=${page}&limit=${limit}`,
      { headers: authHeader() },
    );

    const responseData: SalonApiDto[] = apiResponse.data?.data ?? [];
    return responseData.map((salon) => mapApiToSalon(salon, lang));
  },

  async getServicesItems(id: string, lang?: "ar" | "en"): Promise<ProviderServiceUiItem[]> {
    const res = await get<any>(`/providers/${id}`, {
      headers: authHeader(),
    });

    const body = res.data;
    const dto = body?.data ?? body;
    const categories: ProviderServiceCategoryApiDto[] = dto?.services ?? [];
    return mapProviderServicesToUiItems(categories, lang);
  },

  async getServicesItemsMe(lang?: "ar" | "en"): Promise<ProviderServiceUiItem[]> {
    const res = await get<any>(`/providers/me`, {
      headers: authHeader(),
    });

    const body = res.data;
    const dto = body?.data ?? body;
    const categories: ProviderServiceCategoryApiDto[] = dto?.services ?? [];
    return mapProviderServicesToUiItems(categories, lang);
  },

  async updatePackages(
    packages: ProviderPackageApiDto[],
    id?: string,
  ): Promise<SalonUi> {
    const providerId = resolveId(id);
    if (!providerId) throw new Error("Missing providerId");

    const res = await patch<SalonApiDto>(
      `/providers/${providerId}`,
      { packages },
      { headers: authHeader() },
    );

    return mapApiToSalon(res.data);
  },

  async getPendingServices(page = 1, limit = 10): Promise<any> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const apiResponse = await get<any>(`/admin/providers/services/pending?${query.toString()}`, {
      headers: authHeader(),
    });
    return apiResponse.data;
  },

  async updateServiceStatus(providerId: string, serviceItemId: string, status: "APPROVED" | "REJECTED", reason?: string) {
    const url = `/admin/providers/${providerId}/services/${serviceItemId}/status`;
    const response = await patch(url, { status, reason }, { headers: authHeader() });
    return response.data;
  },
};

const ANY_EMPLOYEE_ID = "any";

export const ProviderSlotsService = {
  async getByProviderId(
    id: string | undefined,
    date: string,
    serviceId: string,
    employeeId: string,
  ): Promise<ProviderSlotsDayDto> {
    const providerId = resolveId(id);
    if (!providerId) throw new Error("Missing providerId");

    const params = new URLSearchParams({ date, serviceId });
    if (employeeId && employeeId !== ANY_EMPLOYEE_ID) {
      params.set("employeeId", employeeId);
    }
    const url = `/providers/${providerId}/slots?${params.toString()}`;
    const res = await get<ProviderSlotsDayDto>(url);
    return res.data;
  },
};
