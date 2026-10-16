"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthService } from "@/integration/services/admin/adminAuth.service";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow access to login page without authentication
    if (pathname === "/admin/login") {
      return;
    }

    // Check if user is authenticated
    if (!AdminAuthService.isLoggedIn()) {
      router.push("/admin/login");
      return;
    }

    // Check if user has admin role
    if (!AdminAuthService.isAdmin()) {
      router.push("/admin/login");
      return;
    }
  }, [pathname, router]);

  // If on login page, render without layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <>{children}</>;
}
