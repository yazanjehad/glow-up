import { get, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Rating {
  id: string;
  rating: number;
  comment?: string;
  provider: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  };
  isDeleted?: boolean;
  createdAt?: string;
}

export interface RatingsPaginatedResponse {
  data: Rating[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const ratingsService = {
  list: async (providerId?: string, page = 1, limit = 10): Promise<RatingsPaginatedResponse> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (providerId) {
      params.append("providerId", providerId);
    }
    const url = `/ratings/providers?${params.toString()}`;
    const res = await get<{ items: Rating[]; meta?: { total: number; totalPages: number; page: number; limit: number } }>(url, { headers: authHeader() });
    // API returns { items: Rating[], meta: {...} }
    const data = res.data;
    return {
      data: data?.items || [],
      total: data?.meta?.total || data?.items?.length || 0,
      totalPages: data?.meta?.totalPages || 1,
      page: data?.meta?.page || page,
      limit: data?.meta?.limit || limit,
    };
  },

  delete: async (id: string): Promise<void> => {
    await patch(`/ratings/${id}/delete`, {}, { headers: authHeader() });
  },
};
