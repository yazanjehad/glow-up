import { post } from "../../http/http.client";
import { AdminAuthResponse, AdminUserDto } from "./admin.types";
import { TOKEN_KEY, USER_KEY } from "../../../app/models/constants";

export const AdminAuthService = {
  async loginWithOTP(credentials: {
    phone: string;
    code: string;
  }): Promise<AdminAuthResponse> {
    const response = await post<AdminAuthResponse>(
      "/auth/login/otp",
      credentials
    );

    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
      this.setUser(response.data.user);
    }

    return response.data;
  },

  async requestOTP(phone: string): Promise<{ message: string }> {
    const response = await post<{ message: string }>("/auth/otp/request", {
      phone,
    });
    return response.data;
  },

  logout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getUser(): AdminUserDto | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser(user: AdminUserDto): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  },

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "SUPER_ADMIN";
  },
};