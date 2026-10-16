"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserRole } from "@/lib/auth/permissions";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === UserRole.EMPLOYEE) {
      router.replace("/admin-dashboard/orders");
    } else {
      router.replace("/admin-dashboard/home");
    }
  }, [router]);

  return null;
}
