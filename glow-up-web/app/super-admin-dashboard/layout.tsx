"use client";

import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import SidebarDashboard from "../../components/dashboard/sidebarDashboard";
import HeaderDashboard from "../../components/dashboard/headerDashboard";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { superAdminMenuItems as items } from "./menuItemsSuper";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { SidebarSection } from "../models/sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function SuperAdminDashboardLayout({ children }: LayoutProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {
    // SUPER_ADMIN sees all items
    if (isSuperAdmin()) {
      return items as unknown as SidebarSection[];
    }

    // Filter sections and links based on permissions
    const filtered: SidebarSection[] = [];

    for (const section of items) {
      const allowedLinks = section.links.filter((link: any) => {
        // Hide super admin only links for non-super admins
        if (link.superAdminOnly) return false;
        // If no permissions required, show the link
        if (!link.permissions || link.permissions.length === 0) return true;
        // Check if user has required permissions
        return hasPermission(link.permissions);
      });

      // Only include section if it has visible links
      if (allowedLinks.length > 0) {
        filtered.push({
          ...section,
          links: allowedLinks,
        } as unknown as SidebarSection);
      }
    }

    return filtered;
  }, []);

  return (
    <RouteGuard type="super-admin">
      <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
        <HeaderDashboard logoutRoute="/admin/login" dashboardType="superadmin" />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`
              relative h-full flex flex-col border-gray-200 bg-white transition-all duration-300 ease-in-out shrink-0 z-40
              ${isRTL ? "border-s" : "border-e"}
              ${isCollapsed ? "w-[60px]" : "w-64"}
            `}
          >
            {/* Desktop Toggle Button */}
            <div className="flex items-center pt-3 pb-2 px-2 justify-center">
              <button
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"

              >
                {isCollapsed ? (
                  isRTL ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />
                ) : (
                  isRTL ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-1">
              <SidebarDashboard items={filteredMenuItems} isCollapsed={isCollapsed} />
            </div>
          </aside>

          <main className="flex-1 min-h-0 overflow-auto p-4 md:p-6 transition-all duration-300">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
