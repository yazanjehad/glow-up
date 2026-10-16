import { get, post, patch } from "../../http/http.client";
import {
  CreateAdminDto,
  AdminUserDto,
  PaginatedAdminsResponse,
  UpdateAdminStatusDto,
} from "./admin.types";
import { AdminAuthService } from "./adminAuth.service";

export const AdminUserService = {
  /**
   * Create new admin user (Super Admin only)
   */
  async createAdmin(data: CreateAdminDto): Promise<AdminUserDto> {
    const token = AdminAuthService.getToken();
    const response = await post<AdminUserDto>("/admin/user", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Get all admin users (Super Admin only)
   */
  async getAllAdmins(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedAdminsResponse> {
    const token = AdminAuthService.getToken();
    const query = new URLSearchParams();

    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const url = `/admin/users/admins${query.toString() ? `?${query.toString()}` : ""}`;

    const response = await get<PaginatedAdminsResponse>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  /**
   * Update admin user status (Super Admin only)
   */
  async updateAdminStatus(
    id: string,
    data: UpdateAdminStatusDto
  ): Promise<AdminUserDto> {
    const token = AdminAuthService.getToken();
    const response = await patch<AdminUserDto>(
      `/admin/users/${id}/status`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
