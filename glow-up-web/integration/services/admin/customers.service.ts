import { get, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Customer {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  totalBookings: number;
  avgRating: number;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  minBookings?: number;
  maxBookings?: number;
  minRating?: number;
  maxRating?: number;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: string;
}

export const customersService = {
  list: async (params: CustomerListParams): Promise<CustomersResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.minBookings) query.append("minBookings", params.minBookings.toString());
    if (params.maxBookings) query.append("maxBookings", params.maxBookings.toString());
    if (params.minRating) query.append("minRating", params.minRating.toString());
    if (params.maxRating) query.append("maxRating", params.maxRating.toString());
    if (params.createdAfter) query.append("createdAfter", params.createdAfter);
    if (params.createdBefore) query.append("createdBefore", params.createdBefore);
    if (params.sortBy) query.append("sortBy", params.sortBy);

    const res = await get<CustomersResponse>(`/customer/list?${query.toString()}`, {
      headers: authHeader(),
    });
    return res.data;
  },

  updateStatus: async (id: string, status: "ACTIVE" | "SUSPENDED") => {
    const res = await patch(`/admin/users/${id}/status`, { status }, {
      headers: authHeader(),
    });
    return res.data;
  },

  deleteAccount: async (id: string, code: string, reason?: string) => {
    const res = await patch(`/admin/users/${id}/delete`, { code, reason }, {
      headers: authHeader(),
    });
    return res.data;
  },
};
