import { LucideIcon } from "lucide-react";
import { EmployeeCapabilities } from "@/lib/auth/permissions";

export interface SidebarLink {
  titleKey: string;
  href: string;
  icon: LucideIcon | any;
  requiresCapability?: keyof EmployeeCapabilities;
  providerOnly?: boolean;
  employeeOnly?: boolean;
}

export interface SidebarSection {
  sectionTitle: string;
  isCollapsible?: boolean;
  employeeOnly?: boolean;
  providerOnly?: boolean;
  superAdminOnly?: boolean;
  links: SidebarLink[];
}

export interface ReusableSidebarProps {
  items: SidebarSection[];
}
