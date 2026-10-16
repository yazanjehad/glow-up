import { get, post, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface LookupName {
  en: string;
  ar: string;
  _id?: string;
}

export interface Lookup {
  _id: string;
  key: string;
  code: string;
  name: LookupName;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LookupsResponse {
  totalPages: number;
  data: Lookup[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateLookupPayload {
  key: string;
  code: string;
  name: {
    en: string;
    ar: string;
  };
  isActive: boolean;
  order: number;
}

export interface UpdateLookupPayload {
  key?: string;
  code?: string;
  name?: {
    en: string;
    ar: string;
  };
  isActive?: boolean;
  order?: number;
}

export const lookupsService = {
  list: async (page = 1, limit = 20): Promise<LookupsResponse> => {
    const res = await get<LookupsResponse>(
      `/lookups/all?page=${page}&limit=${limit}`,
      { headers: authHeader() }
    );
    return res.data;
  },

  create: async (payload: CreateLookupPayload): Promise<Lookup> => {
    const res = await post<{ data: Lookup }>("/lookups", payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return res.data?.data ?? res.data;
  },

  update: async (id: string, payload: UpdateLookupPayload): Promise<Lookup> => {
    const res = await patch<{ data: Lookup }>(`/lookups/${id}`, payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return res.data?.data ?? res.data;
  },
};
