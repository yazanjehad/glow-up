import { PermissionType } from "@/lib/auth/permissions";
import { get, post, patch } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}



export interface AdminUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  permissions: PermissionType[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAdminUserPayload {
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

function unwrapData<T>(res: any): T {
  return (res?.data?.data ?? res?.data ?? res) as T;
}

export const adminUsersService = {
  list: async (page = 1, limit = 10): Promise<AdminUsersResponse> => {
    const res = await get<AdminUsersResponse>(
      `/admin/users/admins?page=${page}&limit=${limit}`,
      { headers: authHeader() }
    );
    return res.data;
  },

  create: async (payload: CreateAdminUserPayload): Promise<AdminUser> => {
    const cleanPayload: CreateAdminUserPayload = {
      name: payload.name.trim(),
      phone: payload.phone.trim(),
    };
    
    if (payload.email?.trim()) {
      cleanPayload.email = payload.email.trim();
    }
    if (payload.note?.trim()) {
      cleanPayload.note = payload.note.trim();
    }

    const res = await post<{ data: AdminUser }>("/admin/user", cleanPayload, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
    });
    return unwrapData<AdminUser>(res);
  },

  updatePermissions: async (
    userId: string,
    permissions: PermissionType[]
  ): Promise<void> => {
    await patch(
      `/admin/${userId}/permissions`,
      { permissions },
      { headers: { ...authHeader(), "Content-Type": "application/json" } }
    );
  },
};
export { PermissionType };

