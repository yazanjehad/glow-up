// Admin Types & DTOs

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  phone?: string;
  note?: string;
  status?: "ACTIVE" | "SUSPENDED";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  user: AdminUserDto;
}

export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  note?: string;
  phone?: string;
}

export interface UpdateAdminStatusDto {
  status: "ACTIVE" | "SUSPENDED";
}

export interface PaginatedAdminsResponse {
  data: AdminUserDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}
