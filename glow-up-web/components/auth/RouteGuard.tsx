"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  canAccessProviderPortal, 
  canAccessSuperAdminPortal, 
  canAccessRoute,
  isSuperAdmin,
  getCurrentUser 
} from "@/lib/auth/permissions";

interface RouteGuardProps {
  children: React.ReactNode;
  type: "provider" | "super-admin";
}

export function RouteGuard({ children, type }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      
      // No user logged in
      if (!user) {
        if (type === "provider") {
          router.replace("/login");
        } else {
          router.replace("/admin/login");
        }
        return;
      }

      // Check portal access based on type
      if (type === "provider") {
        if (!canAccessProviderPortal()) {
          // Redirect to appropriate portal or login
          if (canAccessSuperAdminPortal()) {
            router.replace("/super-admin-dashboard");
          } else {
            router.replace("/login");
          }
          return;
        }
        setAuthorized(true);
      } else if (type === "super-admin") {
        if (!canAccessSuperAdminPortal()) {
          // Redirect to appropriate portal or login
          if (canAccessProviderPortal()) {
            router.replace("/admin-dashboard");
          } else {
            router.replace("/admin/login");
          }
          return;
        }

        // For non-SUPER_ADMIN users, check route-specific permissions
        if (!isSuperAdmin() && pathname && !canAccessRoute(pathname)) {
          // Find first accessible route
          router.replace("/super-admin-dashboard");
          return;
        }

        setAuthorized(true);
      }

      setLoading(false);
    };

    checkAuth();
  }, [pathname, router, type]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button-green"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
