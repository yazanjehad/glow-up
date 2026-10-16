"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthService } from "@/integration/services/admin/adminAuth.service";
import { AdminUserDto } from "@/integration/services/admin/admin.types";

export const useAdminAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const currentUser = AdminAuthService.getUser();
    setUser(currentUser);
    setLoading(false);
  };

  const logout = () => {
    AdminAuthService.logout();
    setUser(null);
    router.push("/admin/login");
  };

  const redirectToDashboard = () => {
    if (!user) return;

    if (user.role === "SUPER_ADMIN") {
      router.push("/super-admin-dashboard");
    } else if (user.role === "ADMIN") {
      router.push("/admin-dashboard");
    }
  };

  return {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    logout,
    redirectToDashboard,
    checkAuth,
  };
};
