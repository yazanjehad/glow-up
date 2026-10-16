"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { useProviderStore } from "@/store/providerStore";
import {
  Menu,
  User,
  LogOut,
  MessageCircle,
  Languages,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY } from "@/app/models/constants";
import { NotificationsService } from "@/integration/services/notifications/notifications.service";
import NotificationDropdown from "@/components/shared/NotificationDropdown";

type DashboardType = 'customer' | 'provider' | 'superadmin' | 'employee';

export default function HeaderDashboard({
  showMessages = false,
  logoutRoute = "",
  dashboardType = "provider",
}: {
  showMessages?: boolean;
  logoutRoute?: string;
  dashboardType?: DashboardType;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === "ar";
  const resetProvider = useProviderStore((s: any) => s.reset);
  
  // Check if user is an employee
  const [userRole, setUserRole] = useState<string>("");
  
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user?.role || "");
      }
    } catch (error) {
      console.error("Error getting user role:", error);
    }
  }, []);
  
  const loadNotifCount = async () => {
    try {
      const res = await NotificationsService.getUnreadCount();
      if (res?.data) {
        setNotifCount(Number(res.data.unreadCount ?? 0));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    loadNotifCount();
  }, []);

  const toggleLanguage = () => {
    const next = isRTL ? "en" : "ar";
    i18n.changeLanguage(next);
    document.documentElement.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", next);
  };

  const handleLogout = () => {
    resetProvider();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
    localStorage.removeItem("providerId");
    localStorage.removeItem("provider");
    localStorage.removeItem("provider-store");
    localStorage.removeItem("otpToken");
    localStorage.removeItem("glow-up-chat-list");
    localStorage.removeItem("booking-storage");
    localStorage.removeItem("services-storage");
    localStorage.removeItem("multi-booking-storage");
    setMenuOpen(false);
    router.push(logoutRoute || "/login");
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      className="flex h-16 shrink-0 flex-nowrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 sm:px-10 md:px-12"
    >
      {/* logo */}
      <Link href="/admin-dashboard" className="shrink-0" aria-label="The Glow Hub">
        <Image
          src="/logo.png"
          alt="The Glow Hub"
          width={100}
          height={40}
          className="h-9 w-auto"
          priority
        />
      </Link>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 hover:bg-gray-50 transition-colors"
            aria-label={t("header.menu")}
            aria-expanded={menuOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2ecdf]">
              <User className="h-4 w-4 text-[#79a66b]" />
            </div>
            <Menu className="h-4 w-4 text-gray-600" />
          </button>

          {menuOpen && (
            <div
              dir={isRTL ? "rtl" : "ltr"}
              className={`absolute top-full z-50 mt-4 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl ${isRTL ? "left-0" : "right-0"}`}
            >
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-gray-50"
              >
                <Languages className="h-4 w-4 text-gray-600" />
                <span className="font-medium">
                  {isRTL ? "English" : "العربية"}
                </span>
              </button>
              {dashboardType === "provider" && (
                <Link
                  href="/admin-dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{t("header.profile")}</span>
                </Link>
              )}
              {showMessages && userRole !== "EMPLOYEE" && (
                <Link
                  href="/admin-dashboard/chat"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-gray-50"
                >
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{t("header.chat")}</span>
                </Link>
              )}
              <div className="my-1 h-px bg-gray-100" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-semibold">{t("header.logout")}</span>
              </button>
            </div>
          )}
        </div>

        <NotificationDropdown
          notifCount={notifCount}
          onCountUpdate={loadNotifCount}
          dashboardType={dashboardType}
        />
      </div>
    </header>
  );
}