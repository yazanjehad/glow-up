import { get } from "@/integration/http/http.client"; 
import { AdminApiDto, AdminUi, mapApiAdminToUi } from "./admin.type";

export type GetAdminsParams = {
  page?: number;
  limit?: number;
};

export type GetAdminsResponse = {
  data: AdminUi[];
  total: number;
  page: number;
  totalPages: number;
};

export const adminService = {
  getAdmins: async (params?: GetAdminsParams): Promise<GetAdminsResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const url = `/admin/users/admins?${query.toString()}`;

    // Cleaned: Removed manual Authorization header
    const res = await get<{
      success: boolean;
      data: AdminApiDto[];
      pagination: { total: number; page: number; totalPages: number };
    }>(url);

    return {
      data: res.data.data.map(mapApiAdminToUi),
      total: res.data.pagination.total,
      page: res.data.pagination.page,
      totalPages: res.data.pagination.totalPages,
    };
  },
};