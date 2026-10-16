import { Calendar, Users, Ticket, UserCog, Settings, Megaphone, Gift, CreditCard, UserCheck, Star, Layers } from "lucide-react";
import { PermissionType } from "@/lib/auth/permissions";

export interface MenuLink {
  titleKey: string;
  href: string;
  icon: typeof Users;
  permissions?: PermissionType[];
  superAdminOnly?: boolean;
}

export interface MenuSection {
  sectionTitle: string;
  links: MenuLink[];
}

export const superAdminMenuItems: MenuSection[] = [
  {
    sectionTitle: "sidebar.salons_section",
    links: [
      { 
        titleKey: "sidebar.salons", 
        href: "/super-admin-dashboard/salons", 
        icon: Users,
        permissions: [PermissionType.PROVIDER_VIEW, PermissionType.PROVIDER_APPROVE],
      },
      { 
        titleKey: "sidebar.employees", 
        href: "/super-admin-dashboard/employees", 
        icon: UserCheck,
        permissions: [PermissionType.VIEW_EMPLOYEES],
      },
      { 
        titleKey: "sidebar.ratings", 
        href: "/super-admin-dashboard/ratings", 
        icon: Star,
        permissions: [PermissionType.VIEW_RATINGS, PermissionType.DELETE_RATING],
      },
      { 
        titleKey: "sidebar.customers", 
        href: "/super-admin-dashboard/customers", 
        icon: Users,
        permissions: [PermissionType.VIEW_CUSTOMERS],
      },
    ],
  },
  {
    sectionTitle: "sidebar.services_admin_section",
    links: [
      { 
        titleKey: "sidebar.services_admin", 
        href: "/super-admin-dashboard/services", 
        icon: Layers,
        permissions: [PermissionType.PROVIDER_VIEW], // Adjust permissions as needed
      },
    ],
  },
  {
    sectionTitle: "sidebar.bookings_section",
    links: [
      { 
        titleKey: "sidebar.bookings", 
        href: "/super-admin-dashboard/bookings", 
        icon: Calendar,
        permissions: [PermissionType.APPOINTMENT_VIEW],
      },
    ],
  },
  {
    sectionTitle: "sidebar.tickets_section",
    links: [
      { 
        titleKey: "sidebar.tickets", 
        href: "/super-admin-dashboard/tickets", 
        icon: Ticket,
        permissions: [PermissionType.TICKET_VIEW, PermissionType.TICKET_REPLY],
      },
    ],
  },
  {
    sectionTitle: "sidebar.content_section",
    links: [
      { 
        titleKey: "sidebar.lookups", 
        href: "/super-admin-dashboard/lookups", 
        icon: Settings,
        permissions: [PermissionType.VIEW_LOOKUPS, PermissionType.ADD_LOOKUPS],
      },
      { 
        titleKey: "sidebar.ads", 
        href: "/super-admin-dashboard/ads", 
        icon: Megaphone,
        permissions: [PermissionType.VIEW_ADS, PermissionType.ADD_ADS],
      },
      { 
        titleKey: "sidebar.coupons", 
        href: "/super-admin-dashboard/coupons", 
        icon: Gift,
        permissions: [PermissionType.VIEW_COUPONS],
      },
    ],
  },
  {
    sectionTitle: "sidebar.subscription_section",
    links: [
      { 
        titleKey: "sidebar.plans_management", 
        href: "/super-admin-dashboard/plans", 
        icon: CreditCard,
        permissions: [PermissionType.PLAN_MANAGE, PermissionType.SUBSCRIPTION_MANAGE],
      },
    ],
  },
  {
    sectionTitle: "sidebar.admin_section",
    links: [
      { 
        titleKey: "sidebar.users", 
        href: "/super-admin-dashboard/users", 
        icon: UserCog,
        superAdminOnly: true,
      },
    ],
  },
];
