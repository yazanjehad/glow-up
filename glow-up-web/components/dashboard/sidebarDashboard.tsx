"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SidebarSection } from "../../app/models/sidebar";
import { getCurrentUser, hasEmployeeCapability, UserRole } from "@/lib/auth/permissions";

interface SidebarProps {
  items: SidebarSection[];
  isCollapsed: boolean;
}

export default function Sidebar({ items, isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const user = getCurrentUser();

  const filteredItems = items.filter((section) => {
    if (section.providerOnly && user?.role !== UserRole.PROVIDER) return false;
    if (section.employeeOnly && user?.role !== UserRole.EMPLOYEE) return false;
    if (section.superAdminOnly && user?.role !== UserRole.SUPER_ADMIN) return false;

    return true;
  });

  return (
    <nav className="flex-1 space-y-1.5 py-4">
      {filteredItems.map((section, idx) => {
        const filteredLinks = section.links.filter((link) => {
          if (link.providerOnly && user?.role !== UserRole.PROVIDER) return false;
          if (link.employeeOnly && user?.role !== UserRole.EMPLOYEE) return false;
          if (
            link.requiresCapability &&
            user?.role === UserRole.EMPLOYEE &&
            !hasEmployeeCapability(link.requiresCapability)
          )
            return false;

          return true;
        });

        if (filteredLinks.length === 0) return null;

        return (
          <div key={idx} className={isCollapsed ? "px-1.5" : "px-3"}>
            {!isCollapsed && section.sectionTitle && (
              <h3 className="mb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {t(section.sectionTitle)}
              </h3>
            )}
            <div className="space-y-1">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                    relative flex items-center rounded-xl transition-all duration-200
                    ${isActive ? "bg-primary/10 text-primary font-medium" : "text-gray-500 hover:bg-gray-100"}
                    ${isCollapsed ? "justify-center p-2.5" : "justify-start p-3"}
                  `}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!isCollapsed && (
                      <span className="ms-3 text-sm whitespace-nowrap">
                        {t(link.titleKey)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}