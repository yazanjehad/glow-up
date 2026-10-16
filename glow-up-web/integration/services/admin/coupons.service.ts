import { get, post } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

export type ProviderStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "UNPAID";
function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CouponPurchaser {
  _id: string;
  name: string;
}

export interface CouponProvider {
  _id: string;
  name: string;
}

export interface CouponService {
  serviceId: string;
}

export interface CouponUsageHistory {
  appointmentId: string;
  usedAmount: number;
  usedAt: string;
}

export type CouponStatus = "ACTIVE" | "PARTIAL_USED" | "USED" | "EXPIRED";

export interface Coupon {
  _id: string;
  purchaserId: CouponPurchaser;
  providerId: CouponProvider;
  services: CouponService[];
  usageHistory: CouponUsageHistory[];
  totalPrice: number;
  receivesPhone: string;
  status: CouponStatus;
  code: string;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
  remaining?: number;
  usedPrice?: number;
}

export interface CouponsResponse {
  data: Coupon[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateCouponPayload {
  providerId: string;
  services: { serviceId: string }[];
  receivesPhone: string;
  paymentMethod: string;
}

export interface ProviderOption {
  _id: string;
  name: string;
}

export interface ProviderServiceOption {
  serviceId: string;
  name: string;
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
  categoryName?: string;
}

export const couponsService = {
  list: async (page = 1, limit = 10): Promise<CouponsResponse> => {
    const res = await get<CouponsResponse>(`/coupon?page=${page}&limit=${limit}`, {
      headers: authHeader(),
    });
    return res.data;
  },

  create: async (payload: CreateCouponPayload): Promise<Coupon> => {
    const res = await post<{ data: Coupon }>("/coupon", payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return res.data?.data ?? res.data;
  },

  getProviders: async (): Promise<ProviderOption[]> => {
    const res = await get<{ data: ProviderOption[] } | ProviderOption[]>("/providers?limit=100", {
      headers: authHeader(),
    });
    // Handle both array response and object with data property
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return res.data?.data ?? [];
  },

  getProviderServices: async (
    providerId: string,
    lang: "ar" | "en" = "ar",
  ): Promise<ProviderServiceOption[]> => {
    if (!providerId) return [];

    const res = await get<any>(`/providers/${providerId}`, {
      headers: { ...authHeader(), "Accept-Language": lang },
    });

    const dto = res?.data?.data ?? res?.data ?? {};
    const categories = Array.isArray(dto?.services) ? dto.services : [];

    const options: ProviderServiceOption[] = [];

    for (const category of categories) {
      const categoryName =
        category?.category?.name?.[lang] ||
        category?.category?.name?.en ||
        category?.category?.name?.ar ||
        category?.category?.code ||
        "";
      const items = Array.isArray(category?.items) ? category.items : [];

      for (const item of items) {
        if (!item?._id) continue;
        options.push({
          serviceId: item._id,
          name: item?.name || "",
          price:
            typeof item?.price === "number"
              ? item.price
              : Number(item?.price) || 0,
          durationMinutes:
            typeof item?.durationMinutes === "number"
              ? item.durationMinutes
              : Number(item?.durationMinutes) || 0,
          isActive:
            typeof item?.isActive === "boolean" ? item.isActive : undefined,
          categoryName,
        });
      }
    }

    return options;
  },
getProvidersByStatus: async (
  statuses: ProviderStatus[],
  search?: string
): Promise<ProviderOption[]> => {
  const query = new URLSearchParams();

    if (statuses.length > 0) {
      query.append("status", statuses.join(",")); // هنا بدل append متعدد
    }

    if (search) {
      query.append("name", search);
      query.append("limit", "1000");
    } else {
      query.append("limit", "10");
    }

    let url = `/providers/status?${query.toString()}`;
    
    try {
      const res = await get<any>(url, {
        headers: authHeader(),
      });
      return res.data?.data || [];
    } catch (error: any) {
      if (error?.response?.status === 403) {
        const fallbackUrl = `/providers?${query.toString()}`;
        try {
          const res = await get<any>(fallbackUrl, {
            headers: authHeader(),
          });
          return res.data?.data || [];
        } catch (fbErr) {
          return [];
        }
      }
      console.error(
        "Error in getProvidersByStatus:",
        error?.response?.data || error.message
      );
      return [];
    }
  },
};

