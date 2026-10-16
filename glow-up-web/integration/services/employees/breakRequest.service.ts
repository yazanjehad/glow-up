import { post, get, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface BreakRequestPayload {
  date: string; // Format: "YYYY-MM-DD"
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  reason: string;
}

export type BreakStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BreakRequest {
  id: string;
  employeeId: string | { _id: string; name: string; phone?: string };
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: BreakStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BreakRequestResponse {
  success: boolean;
  data: BreakRequest;
  message?: string;
}

export interface BreakListParams {
  employeeId?: string;
  status?: BreakStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedBreakResponse {
  data: BreakRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const breakRequestService = {
  // Employee: Request a new break
  requestBreak: async (payload: BreakRequestPayload): Promise<BreakRequest> => {
    const res = await post<BreakRequestResponse>("/employees/request-break", payload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return res.data?.data ?? res.data;
  },

  // Employee: Get own break requests
  getEmployeeBreaks: async (): Promise<BreakRequest[]> => {
    const res = await get<{ data: BreakRequest[] } | BreakRequest[]>("/employees/breaks/employee", {
      headers: authHeader(),
    });
    const data = res.data;
    if (Array.isArray(data)) return data;
    return data?.data ?? [];
  },

  // Provider: Get all employee breaks with filters and pagination
  getAllBreaks: async (params: BreakListParams = {}): Promise<PaginatedBreakResponse> => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const url = `/employees/breaks${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await get<PaginatedBreakResponse | { data: BreakRequest[]; total?: number; page?: number; limit?: number; totalPages?: number }>(url, {
      headers: authHeader(),
    });
    
    const raw = res.data;
    // Handle different response shapes
    if (Array.isArray(raw)) {
      return { data: raw, total: raw.length, page: 1, limit: raw.length, totalPages: 1 };
    }
    return {
      data: raw?.data ?? [],
      total: raw?.total ?? 0,
      page: raw?.page ?? 1,
      limit: raw?.limit ?? 10,
      totalPages: raw?.totalPages ?? 1,
    };
  },

  // Provider: Update break request status (approve/reject)
  updateBreakStatus: async (breakId: string, status: BreakStatus): Promise<BreakRequest> => {
    const res = await patch<BreakRequestResponse>(`/employees/breaks/${breakId}/status`, { status }, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return res.data?.data ?? res.data;
  },
};
