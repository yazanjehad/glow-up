import { get } from "../../http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

function authHeader() {
  if (typeof window === "undefined") return {};
  const token = (localStorage.getItem(TOKEN_KEY) || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
export type Gender = "MALE" | "FEMALE";

export interface Employee {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  providerId: string | { _id: string; name: string };
  isActive: boolean;
  avatar?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesResponse {
  data: Employee[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export interface EmployeesPaginatedResponse {
  data: Employee[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const employeesService = {
  list: async (providerId: string, page = 1, limit = 10): Promise<EmployeesPaginatedResponse> => {
    const url = `/employees/provider/${providerId}?page=${page}&limit=${limit}`;
    const res = await get<Employee[] | { items: Employee[]; meta?: { total: number; totalPages: number; page: number; limit: number } }>(url, { headers: authHeader() });
    const data = res.data;

    // Helper to ensure data consistency from various API formats
    const mapEmployeeData = (emp: any): Employee => ({
      ...emp,
      _id: emp._id || emp.id,
      providerId: emp.providerId || providerId,
      isActive: 
        typeof emp.isActive === 'boolean' ? emp.isActive : 
        (typeof emp.active === 'boolean' ? emp.active : 
        (emp.status === 'ACTIVE' || emp.status === 'active' ? true : false))
    });

    // Handle both array and { items: [...], meta: {...} } response formats
    if (Array.isArray(data)) {
      const mappedData = data.map(mapEmployeeData);
      return { data: mappedData, total: data.length, totalPages: 1, page: 1, limit: data.length };
    }
    if (data && 'items' in data) {
      const mappedData = (data.items || []).map(mapEmployeeData);
      return {
        data: mappedData,
        total: data.meta?.total || mappedData.length || 0,
        totalPages: data.meta?.totalPages || 1,
        page: data.meta?.page || page,
        limit: data.meta?.limit || limit,
      };
    }
    return { data: [], total: 0, totalPages: 1, page: 1, limit: 10 };
  },
  getGenderIcon: (gender?: Gender): string => {
    if (gender === "FEMALE") return "/icons/female.jpeg";
    return "/icons/male.jpeg";
  },
};
