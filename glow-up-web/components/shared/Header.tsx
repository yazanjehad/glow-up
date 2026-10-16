"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import {
  User,
  LogOut,
  Download,
  Calendar,
  MessageCircle,
  Languages,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { TOKEN_KEY } from "@/app/models/constants";
import { getToken } from "@/integration/services/auth/authServices";
import { NotificationsService } from "@/integration/services/notifications/notifications.service";
import NotificationDropdown from "./NotificationDropdown";
import { useProviderStore } from "@/store/providerStore";
import { Button } from "@/components/ui/button";

const UI = {
  headerH: "h-16",
  containerMax: "max-w-[1440px]",
  innerMax: "max-w-[1030px]",
  primaryBtn: "h-9 rounded-lg px-3 text-[12px] md:h-10 md:px-4 md:text-[13px] font-semibold",
  secondaryBtn:
    "h-8 md:h-10 rounded-lg px-2 md:px-4 text-[12px] md:text-[14px] font-semibold whitespace-nowrap",
  iconBtn:
    "h-8 w-8 md:h-9 md:w-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors",
  profilePill:
    "relative inline-flex items-center h-[36px] w-[70px] md:h-[40px] md:w-[80px] rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition overflow-hidden",
  menuBox:
    "top-full mt-3 w-[230px] rounded-[16px] bg-white border border-[#E6E6E6] shadow-[0_10px_24px_rgba(0,0,0,0.12)] p-1.5",
  menuItem:
    "flex items-center gap-2 rounded-[12px] px-3 py-2.5 hover:bg-gray-50",
};

function GetAppButton({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation();

  function handleDownloadApp() {
    // TODO: Implement download logic
  }

  return (
    <Link
      href="https://play.google.com/store/apps/details?id=com.glowup.user"
      target="_blank"
      rel="noopener noreferrer"
      dir={isRTL ? "rtl" : "ltr"}
      className={`
        inline-flex
        items-center justify-center
        ${UI.primaryBtn}
        bg-[#79A66B] text-white
        whitespace-nowrap
        hover:bg-[#6B975D]
        transition-colors
      `}
    >
      <span
        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        {t("header.getApp")}
        <span className="grid h-4 w-4 place-items-center rounded border border-white/80">
          <Download className="h-3 w-3" onClick={handleDownloadApp} />
        </span>
      </span>
    </Link>
  );
}

function BookNowButton() {
  const { t } = useTranslation();

  return (
    <Link
      href="/home"
      className={`
        inline-flex items-center justify-center
        ${UI.secondaryBtn}
        border border-[#79A66B] bg-white text-[#79A66B]
        hover:bg-[#EFF7EF]
        transition-colors
      `}
    >
      <span className="text-sm">{t("bookNow")}</span>
    </Link>
  );
}

function NavLinks({
  onNavigate,
  className,
  itemClassName = "text-[14px]",
}: {
  onNavigate?: () => void;
  className?: string;
  itemClassName?: string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const links = [
    { href: "/about", label: t("header.aboutUs") },
    { href: "/contact", label: t("header.contactUs") },
  ];

  return (
    <nav className={className}>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "font-semibold transition-colors whitespace-nowrap",
              itemClassName,
              active
                ? "text-[#79A66B]"
                : "text-[#111] hover:text-[#79A66B]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isProviderRoute = pathname?.startsWith('/provider');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const lang = i18n.language || "en";
  const isRTL = lang.startsWith("ar");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const resetProviderStore = useProviderStore((s: any) => s.reset);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, [pathname]);

  const toggleLanguage = () => {
    const next = isRTL ? "en" : "ar";
    i18n.changeLanguage(next);
    document.documentElement.setAttribute(
      "dir",
      next.startsWith("ar") ? "rtl" : "ltr",
    );
    document.documentElement.setAttribute("lang", next);
  };

  async function loadNotifCount() {
    if (!getToken()) {
      setNotifCount(0);
      return;
    }
    try {
      const res = await NotificationsService.getUnreadCount();
      if (!res) return;
      const data = res.data;
      const count = Number(data?.unreadCount ?? 0);
      setNotifCount(Number.isFinite(count) ? count : 0);
    } catch {
      setNotifCount(0);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      setNotifCount(0);
      return;
    }
    loadNotifCount();
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    resetProviderStore();
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
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <header
      dir={isRTL ? "rtl" : "ltr"}
      className="sticky top-0 z-50 bg-white border-b border-[#E0E0E0]"
    >
      <div className={`mx-auto w-full ${UI.containerMax} ${UI.headerH} px-2 sm:px-6 lg:px-8`}>
        <div className={`mx-auto w-full h-full flex items-center justify-between px-3 md:px-0 md:gap-6`}>
          {/*  ICONS AREA */}
          <div
            dir="ltr"
            className={cn(
              "flex items-center gap-2 md:gap-3 shrink-0",
              isRTL ? "order-3 justify-start" : "order-3 justify-end"
            )}
          >
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-x"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-menu"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y2="18" y1="18" />
                  </svg>
                )}
              </button>
            </div>

            {isLoggedIn && (
              <NotificationDropdown
                notifCount={notifCount}
                onCountUpdate={loadNotifCount}
                className={isRTL ? "order-1" : "order-3"}
              />
            )}

            {/* Profile Trigger + Menu — only when logged in */}
            {isLoggedIn && (
              <div ref={menuRef} className="relative order-2 hidden md:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={UI.profilePill}
                >
                  <div className="flex-1 grid place-items-center">
                    <div className="space-y-[4px]">
                      <span className="block h-[2px] w-[18px] rounded-full bg-[#111]" />
                      <span className="block h-[2px] w-[18px] rounded-full bg-[#111]" />
                      <span className="block h-[2px] w-[18px] rounded-full bg-[#111]" />
                    </div>
                  </div>

                  <div className="relative h-full w-[40px]">
                    <div className="absolute right-[4px] top-1/2 -translate-y-1/2 grid h-[30px] w-[30px] place-items-center rounded-full bg-[#E9F2E7]">
                      <User className="h-[20px] w-[20px] text-[#79A66B]" />
                    </div>
                  </div>
                </button>

                {userMenuOpen && (
                  <div
                    dir={isRTL ? "rtl" : "ltr"}
                    className={cn(
                      "absolute z-50",
                      UI.menuBox,
                      // Icon row is always LTR: profile sits on the left in Arabic, on the right in English
                      isRTL ? "left-0" : "right-0",
                    )}
                  >
                    {!isProviderRoute && (
                      <>
                        <Link
                          href="/accounts/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className={UI.menuItem}
                        >
                          <User className="h-4 w-4 text-[#111]" />
                          <span className="text-[15px] font-medium text-[#111]">
                            {t("header.profile")}
                          </span>
                        </Link>

                        <Link
                          href="/accounts/packages"
                          onClick={() => setUserMenuOpen(false)}
                          className={UI.menuItem}
                        >
                          <Package className="h-4 w-4 text-[#111]" />
                          <span className="text-[15px] font-medium text-[#111]">
                            {t("header.packages")}
                          </span>
                        </Link>

                        <Link
                          href="/my-booking"
                          onClick={() => setUserMenuOpen(false)}
                          className={UI.menuItem}
                        >
                          <Calendar className="h-4 w-4 text-[#111]" />
                          <span className="text-[15px] font-medium text-[#111]">
                            {t("header.bookings")}
                          </span>
                        </Link>

                        <Link
                          href="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className={UI.menuItem}
                        >
                          <MessageCircle className="h-4 w-4 text-[#111]" />
                          <span className="text-[15px] font-medium text-[#111]">
                            {t("header.chat")}
                          </span>
                        </Link>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        toggleLanguage();
                        setUserMenuOpen(false);
                      }}
                      className={`w-full ${UI.menuItem}`}
                    >
                      <Languages className="h-4 w-4 text-[#111]" />
                      <span className="text-[15px] font-semibold text-[#111]">
                        {isRTL
                          ? t("header.languageEn")
                          : t("header.languageAr")}
                      </span>
                    </button>

                    <div className="my-1 h-px bg-gray-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`w-full ${UI.menuItem} hover:bg-red-50`}
                    >
                      <LogOut className="h-4 w-4 text-red-600" />
                      <span className="text-[15px] font-semibold text-red-600">
                        {t("header.logout")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div
              className={`
  flex items-center gap-2 md:gap-3
  ${isRTL ? "order-3" : "order-1"}
`}
            >
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="h-9 px-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-[13px] font-semibold text-[#111]"
                  aria-label={isRTL ? t("header.languageEn") : t("header.languageAr")}
                >
                  {isRTL ? "EN" : "AR"}
                </button>
              )}
<div className="hidden md:block">
  <BookNowButton />
</div>              {!isLoggedIn && pathname !== "/login" && (
                <Link
                  href="/login"
                  className={`
                    inline-flex items-center justify-center
                    ${UI.secondaryBtn}
                    bg-[#79A66B] text-white
                    hover:bg-[#6B975D]
                    rounded-lg shadow-sm
                  `}
                >
                  {t("header.login")}
                </Link>
              )}
            </div>
          </div>

          <div
            dir="ltr"
            className={`flex items-center gap-2 md:gap-4 ${
              isRTL ? "order-1 justify-end" : "order-1 justify-start"
            }`}
          >
            {isRTL ? (
              <>
                <NavLinks className="hidden md:flex items-center gap-6" />
<div className="hidden md:block">
  <GetAppButton isRTL={isRTL} />
</div>                <Link
                  href="/home"
                  aria-label="The Glow Hub"
                  className="select-none inline-flex items-center"
                >
                  <Image
                    src="/logo.png"
                    alt="The Glow Hub"
                    width={75}
                    height={30}
                    className="h-7 md:h-10 w-auto"
                    priority
                  />
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="inline-flex items-center">
                  <Image
                    src="/logo.png"
                    alt="The Glow Hub"
                    width={75}
                    height={30}
                    className="h-7 md:h-10 w-auto"
                    priority
                  />
                </Link>
<div className="hidden md:block">
  <GetAppButton isRTL={isRTL} />
</div>
                <NavLinks className="hidden md:flex items-center gap-6" />
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {false && (
          <div className="md:hidden pb-4 border-t pt-4">
            <nav className="flex flex-col gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                {t("header.searchPlaceholder")}
              </Link>

              <Link
                href="/profile"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                {t("header.profile")}
              </Link>

              <Link
                href="/favorites"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                {t("header.favorites")}
              </Link>

              <Link
                href="/support"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                {t("header.support")}
              </Link>

              <Link href="/home">
                <Button className="w-full rounded-full bg-[#79A66B] hover:bg-[#6B975D] text-white">
                  {t("header.getApp")}
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
  {/* Mobile Menu Overlay */}
{mobileMenuOpen && (
  <div className="fixed inset-0 top-16 z-40 bg-white md:hidden overflow-y-auto">
    <div className="flex flex-col p-6 gap-6">
      {/* الأزرار الرئيسية */}
      <div className="flex flex-col gap-3">
        <BookNowButton />
        {!isLoggedIn && (
          <Link href="/login" className="w-full h-10 flex items-center justify-center rounded-lg bg-[#79A66B] text-white font-semibold">
            {t("header.login")}
          </Link>
        )}
      </div>

      <NavLinks
        onNavigate={() => setMobileMenuOpen(false)}
        className="flex flex-col gap-4 border-t pt-6"
        itemClassName="text-lg"
      />

      {/* روابط إضافية إذا كان المستخدم مسجلاً دخول */}
      {isLoggedIn && (
        <div className="flex flex-col border-t pt-6 gap-4">
          {!isProviderRoute && (
            <>
              <Link href="/accounts/profile" className="flex items-center gap-3 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                <User className="w-5 h-5" /> {t("header.profile")}
              </Link>
              <Link href="/accounts/packages" className="flex items-center gap-3 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                <Package className="w-5 h-5" /> {t("header.packages")}
              </Link>
              <Link href="/my-booking" className="flex items-center gap-3 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                <Calendar className="w-5 h-5" /> {t("header.bookings")}
              </Link>
              <Link href="/chat" className="flex items-center gap-3 text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                <MessageCircle className="w-5 h-5" /> {t("header.chat")}
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 text-lg font-medium"
          >
            <Languages className="w-5 h-5" />
            {isRTL ? t("header.languageEn") : t("header.languageAr")}
          </button>
          <div className="h-px bg-gray-100" />
          <button onClick={handleLogout} className="flex items-center gap-3 text-lg font-medium text-red-600">
            <LogOut className="w-5 h-5" /> {t("header.logout")}
          </button>
        </div>
      )}
    </div>
  </div>
)}
    </header>
  );
}
