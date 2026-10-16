import {
  Home,
  ClipboardList,
  Store,
  MapPin,
  Calendar,
  FileText,
  Image as ImageIcon,
  Users,
  MessageCircle,
  Package,
  Coffee,
  ClipboardCheck,
  Crown,
  Settings,
  MapPinHouse,
} from "lucide-react";
import { SidebarSection } from "../models/sidebar";

export const superAdminMenuItems: SidebarSection[] = [
  {
    sectionTitle: "",
    isCollapsible: false,
    links: [
      {
        titleKey: "provider.sidebar.home",
        href: "/admin-dashboard/home",
        icon: Home,
        requiresCapability: "canViewStatistics",
      },
    ],
  },
  {
    sectionTitle: "provider.sidebar.orders_section",
    isCollapsible: false,
    links: [
      {
        titleKey: "provider.sidebar.orders",
        href: "/admin-dashboard/orders",
        icon: ClipboardList,
        requiresCapability: "canViewOwnBookings",
      },
      {
        titleKey: "chat.pageTitle",
        href: "/admin-dashboard/chat",
        icon: MessageCircle,
        providerOnly: true,
      },
    ],
  },
  {
    sectionTitle: "provider.sidebar.business_management",
    isCollapsible: true,
    providerOnly: true,
    links: [
      {
        titleKey: "provider.sidebar.salon_details",
        href: "/admin-dashboard/salon-details",
        icon: Store,
      },
      {
        titleKey: "provider.sidebar.service_location",
        href: "/admin-dashboard/location-settings",
        icon: MapPinHouse,
      },
      {
        titleKey: "provider.sidebar.location",
        href: "/admin-dashboard/map-location",
        icon: MapPin,
      },
      {
        titleKey: "provider.sidebar.working_hours",
        href: "/admin-dashboard/working-hours",
        icon: Calendar,
      },
      {
        titleKey: "provider.sidebar.services",
        href: "/admin-dashboard/services",
        icon: FileText,
      },
      {
        titleKey: "provider.sidebar.documents",
        href: "/admin-dashboard/documents",
        icon: FileText,
      },
      {
        titleKey: "provider.sidebar.packages",
        href: "/admin-dashboard/packages",
        icon: Package,
      },
      {
        titleKey: "provider.sidebar.gallery",
        href: "/admin-dashboard/gallery",
        icon: ImageIcon,
      },
      {
        titleKey: "provider.sidebar.team",
        href: "/admin-dashboard/team",
        icon: Users,
      },
    ],
  },
  {
    sectionTitle: "provider.sidebar.employee_section",
    isCollapsible: false,
    employeeOnly: true,
    links: [
      {
        titleKey: "provider.sidebar.request_break",
        href: "/admin-dashboard/request-break",
        icon: Coffee,
        requiresCapability: "canManageBreakTime",
      },
    ],
  },
  {
    sectionTitle: "provider.sidebar.breaks_management",
    isCollapsible: false,
    providerOnly: true,
    links: [
      {
        titleKey: "provider.sidebar.manage_breaks",
        href: "/admin-dashboard/manage-breaks",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    sectionTitle: "provider.sidebar.subscription_section",
    isCollapsible: false,
    providerOnly: true,
    links: [
      {
        titleKey: "provider.sidebar.my_subscription",
        href: "/admin-dashboard/my-subscription",
        icon: Crown,
      },
    ],
  },
  {
    sectionTitle: "provider.sidebar.settings_section",
    isCollapsible: false,
    providerOnly: true,
    links: [
      {
        titleKey: "provider.sidebar.settings",
        href: "/admin-dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
