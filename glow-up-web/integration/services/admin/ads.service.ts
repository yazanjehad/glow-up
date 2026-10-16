import { get, post, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Ad {
  _id: string;
  title: string;
  description: string;
  image?: string;
  banner?: string;
  link_to: string;
  providerId: string;
  status: "pending" | "approved" | "rejected";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdPayload {
  title: string;
  description: string;
  providerId: string;
  banner: string;
  link_to: string;
}

export const adsService = {
  list: async (): Promise<Ad[]> => {
    const res = await get<Ad[]>("/ads/all", { headers: authHeader() });
    return Array.isArray(res.data) ? res.data : [];
  },

  create: async (payload: CreateAdPayload): Promise<Ad> => {
    const res = await post<{ data: Ad }>("/ads", payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return res.data?.data ?? res.data;
  },

  approve: async (id: string): Promise<void> => {
    await patch(`/ads/${id}/approve`, {}, { headers: authHeader() });
  },

  reject: async (id: string): Promise<void> => {
    await patch(`/ads/${id}/reject`, {}, { headers: authHeader() });
  },
};
