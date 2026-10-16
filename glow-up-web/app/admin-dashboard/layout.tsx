"use client";

import { ReactNode, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Sidebar from "../../components/dashboard/sidebarDashboard";
import HeaderDashboard from "../../components/dashboard/headerDashboard";
import { superAdminMenuItems } from "../admin-dashboard/menuItems";
import { useTranslation } from "react-i18next";
import { RouteGuard } from "@/components/auth/RouteGuard";

interface LayoutProps {
  children: ReactNode;
}

export default function ProviderDashboardLayout({ children }: LayoutProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <RouteGuard type="provider">
      <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
        <HeaderDashboard showMessages={true} logoutRoute="/login" />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <aside
            className={`
              relative h-full flex flex-col border-gray-200 bg-white transition-all duration-300 ease-in-out shrink-0 z-40
              ${isRTL ? "border-s" : "border-e"}
              ${isCollapsed ? "w-[60px]" : "w-64"}
            `}
          >
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
              <Sidebar items={superAdminMenuItems} isCollapsed={isCollapsed} />
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