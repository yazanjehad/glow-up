import {
  User,
  Heart,
  Bookmark,
  Settings,
  Headphones,
  type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
};

export const accountMenuItems: MenuItem[] = [
  { label: "profile", href: "/accounts/profile", icon: User },
  { label: "favorites", href: "/accounts/favorites", icon: Heart },
  { label: "header.packages", href: "/accounts/packages", icon: Bookmark },
  { label: "settings", href: "/accounts/settings", icon: Settings },
  { label: "support", href: "/accounts/support", icon: Headphones },
];
